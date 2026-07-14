"""关系型数据存储适配器，支持 SQLite、MySQL 与 PostgreSQL。"""

import json
import os
import threading
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Index,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    inspect,
    select,
)
from sqlalchemy.engine import make_url

from config import Config

COLLECTIONS = {
    "users",
    "results",
    "recommendations",
    "favorites",
    "wardrobe_items",
    "user_profiles",
    "feedback",
}


class DataStore:
    """小型关系型存储层；JSON payload 保留现有前端字段兼容性。"""

    def __init__(self, data_dir=None, database_url=None):
        if data_dir:
            os.makedirs(data_dir, exist_ok=True)
            database_url = f"sqlite:///{os.path.join(data_dir, 'fashion_ai.db')}"
        self.database_url = self.normalize_database_url(
            database_url or Config.DATABASE_URL
        )
        url = make_url(self.database_url)
        connect_args = (
            {"check_same_thread": False} if url.get_backend_name() == "sqlite" else {}
        )
        self.engine = create_engine(
            self.database_url,
            pool_pre_ping=True,
            pool_recycle=1800,
            connect_args=connect_args,
        )
        self.backend = self.engine.url.get_backend_name()
        self._lock = threading.RLock()
        self.metadata = MetaData()
        self.tables = {}
        self._define_tables()
        self._initialize()

    @staticmethod
    def normalize_database_url(database_url):
        """为常见平台 URL 补充明确驱动，保留显式驱动配置。"""
        if database_url.startswith("postgres://"):
            return "postgresql+psycopg://" + database_url[len("postgres://") :]
        if database_url.startswith("postgresql://"):
            return "postgresql+psycopg://" + database_url[len("postgresql://") :]
        if database_url.startswith("mysql://"):
            return "mysql+pymysql://" + database_url[len("mysql://") :]
        return database_url

    def _define_tables(self):
        for collection in sorted(COLLECTIONS):
            columns = [
                Column("id", String(64), primary_key=True),
                Column("owner_user_id", String(64), nullable=True),
            ]
            if collection == "users":
                columns.append(Column("external_id", String(191), nullable=True))
            columns.extend(
                [
                    Column("payload", Text, nullable=False),
                    Column("created_at", String(64), nullable=False),
                    Column("updated_at", String(64), nullable=False),
                ]
            )
            table = Table(collection, self.metadata, *columns)
            Index(f"idx_{collection}_owner", table.c.owner_user_id, table.c.created_at)
            if collection == "users":
                Index("idx_users_external_id", table.c.external_id, unique=True)
            self.tables[collection] = table

    def _initialize(self):
        self.metadata.create_all(self.engine)
        # 兼容本轮之前创建的 SQLite users 表：补充唯一身份列并回填。
        inspector = inspect(self.engine)
        user_columns = {item["name"] for item in inspector.get_columns("users")}
        if "external_id" not in user_columns:
            with self.engine.begin() as connection:
                connection.exec_driver_sql(
                    "ALTER TABLE users ADD COLUMN external_id VARCHAR(191)"
                )
                rows = connection.exec_driver_sql(
                    "SELECT id, payload FROM users"
                ).fetchall()
                for record_id, payload in rows:
                    external_id = (json.loads(payload) or {}).get("external_id")
                    if external_id:
                        connection.exec_driver_sql(
                            "UPDATE users SET external_id = :external_id WHERE id = :id",
                            {"external_id": external_id, "id": record_id},
                        )
            Index(
                "idx_users_external_id",
                self.tables["users"].c.external_id,
                unique=True,
            ).create(self.engine, checkfirst=True)

    def _table(self, collection):
        if collection not in COLLECTIONS:
            raise ValueError(f"未支持的数据集: {collection}")
        return self.tables[collection]

    @staticmethod
    def _decode(row):
        if not row:
            return None
        row = dict(row)
        payload = json.loads(row["payload"])
        payload.update(
            id=row["id"],
            owner_user_id=row.get("owner_user_id"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        if row.get("external_id"):
            payload["external_id"] = row["external_id"]
        return payload

    def insert(self, collection: str, document: dict) -> str:
        table = self._table(collection)
        document = dict(document)
        record_id = document.pop("id", None) or uuid.uuid4().hex
        owner = document.pop("owner_user_id", None)
        external_id = document.get("external_id") if collection == "users" else None
        now = datetime.now(timezone.utc).isoformat()
        document.pop("created_at", None)
        document.pop("updated_at", None)
        values = {
            "id": record_id,
            "owner_user_id": owner,
            "payload": json.dumps(document, ensure_ascii=False),
            "created_at": now,
            "updated_at": now,
        }
        if collection == "users":
            values["external_id"] = external_id
        with self._lock, self.engine.begin() as connection:
            connection.execute(table.insert().values(**values))
        return record_id

    def find_one(self, collection: str, query: dict) -> dict:
        rows = self.find_many(collection, query=query, limit=1)
        return rows[0] if rows else None

    def find_many(
        self, collection: str, query: dict = None, limit: int = 10, offset: int = 0
    ) -> list:
        table = self._table(collection)
        query = query or {}
        supported = {"id", "owner_user_id"}
        if collection == "users":
            supported.add("external_id")
        statement = select(table)
        for key in supported:
            if key in query:
                statement = statement.where(table.c[key] == query[key])
        has_payload_filter = any(key not in supported for key in query)
        statement = statement.order_by(table.c.created_at.desc())
        if not has_payload_filter:
            statement = statement.limit(max(1, min(int(limit), 100))).offset(
                max(0, int(offset))
            )
        with self.engine.connect() as connection:
            candidates = [
                self._decode(row) for row in connection.execute(statement).mappings()
            ]
        matches = [
            doc for doc in candidates if all(doc.get(k) == v for k, v in query.items())
        ]
        if has_payload_filter:
            start = max(0, int(offset))
            return matches[start : start + max(1, min(int(limit), 100))]
        return matches

    def update_one(self, collection: str, query: dict, update: dict) -> bool:
        table = self._table(collection)
        existing = self.find_one(collection, query)
        if not existing:
            return False
        existing.update(update)
        record_id = existing.pop("id")
        owner = existing.pop("owner_user_id", None)
        existing.pop("created_at", None)
        existing.pop("updated_at", None)
        values = {
            "owner_user_id": owner,
            "payload": json.dumps(existing, ensure_ascii=False),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if collection == "users":
            values["external_id"] = existing.get("external_id")
        with self._lock, self.engine.begin() as connection:
            connection.execute(
                table.update().where(table.c.id == record_id).values(**values)
            )
        return True

    def delete_one(self, collection: str, query: dict) -> bool:
        table = self._table(collection)
        existing = self.find_one(collection, query)
        if not existing:
            return False
        with self._lock, self.engine.begin() as connection:
            connection.execute(table.delete().where(table.c.id == existing["id"]))
        return True

    def ping(self):
        try:
            with self.engine.connect() as connection:
                return connection.exec_driver_sql("SELECT 1").scalar_one() == 1
        except Exception:
            return False

    def scan(self, collection: str) -> list:
        """后台维护任务使用的全量扫描；在线列表接口仍必须分页。"""
        table = self._table(collection)
        statement = select(table).order_by(table.c.created_at.asc())
        with self.engine.connect() as connection:
            return [
                self._decode(row) for row in connection.execute(statement).mappings()
            ]


db = DataStore()
