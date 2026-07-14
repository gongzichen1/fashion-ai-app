# models/data_store.py - SQLite 结构化存储适配器

import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone

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
    """SQLite 数据存储。JSON payload 保留前端字段的向后兼容性。"""

    def __init__(self, data_dir=None, database_url=None):
        if data_dir:
            os.makedirs(data_dir, exist_ok=True)
            self.path = os.path.join(data_dir, "fashion_ai.db")
        else:
            url = database_url or Config.DATABASE_URL
            if not url.startswith("sqlite:///"):
                raise ValueError("当前仅支持 sqlite:/// DATABASE_URL")
            self.path = url[len("sqlite:///") :]
            os.makedirs(os.path.dirname(os.path.abspath(self.path)), exist_ok=True)
        self._lock = threading.RLock()
        self._initialize()

    def _connection(self):
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self):
        with self._connection() as connection:
            for collection in COLLECTIONS:
                connection.execute(f"""CREATE TABLE IF NOT EXISTS {collection} (
                        id TEXT PRIMARY KEY,
                        owner_user_id TEXT,
                        payload TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )""")
                connection.execute(
                    f"CREATE INDEX IF NOT EXISTS idx_{collection}_owner "
                    f"ON {collection}(owner_user_id, created_at DESC)"
                )

    def _collection(self, collection):
        if collection not in COLLECTIONS:
            raise ValueError(f"未支持的数据集: {collection}")
        return collection

    @staticmethod
    def _decode(row):
        if not row:
            return None
        payload = json.loads(row["payload"])
        payload.update(
            id=row["id"],
            owner_user_id=row["owner_user_id"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        return payload

    def insert(self, collection: str, document: dict) -> str:
        """插入文档"""
        collection = self._collection(collection)
        document = dict(document)
        record_id = document.pop("id", None) or uuid.uuid4().hex
        owner = document.pop("owner_user_id", None)
        now = datetime.now(timezone.utc).isoformat()
        document.pop("created_at", None)
        document.pop("updated_at", None)
        with self._lock, self._connection() as connection:
            connection.execute(
                f"INSERT INTO {collection} (id, owner_user_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (record_id, owner, json.dumps(document, ensure_ascii=False), now, now),
            )
        return record_id

    def find_one(self, collection: str, query: dict) -> dict:
        """查找单个文档"""
        rows = self.find_many(collection, query=query, limit=1)
        return rows[0] if rows else None

    def find_many(
        self, collection: str, query: dict = None, limit: int = 10, offset: int = 0
    ) -> list:
        """查找多个文档"""
        collection = self._collection(collection)
        query = query or {}
        clauses, params = [], []
        for key in ("id", "owner_user_id"):
            if key in query:
                clauses.append(f"{key} = ?")
                params.append(query[key])
        sql = f"SELECT * FROM {collection}"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        supported = {"id", "owner_user_id"}
        has_payload_filter = any(key not in supported for key in query)
        sql += " ORDER BY created_at DESC"
        if not has_payload_filter:
            sql += " LIMIT ? OFFSET ?"
            params.extend([max(1, min(int(limit), 100)), max(0, int(offset))])
        with self._connection() as connection:
            candidates = [self._decode(row) for row in connection.execute(sql, params)]
        matches = [
            doc for doc in candidates if all(doc.get(k) == v for k, v in query.items())
        ]
        if has_payload_filter:
            return matches[
                max(0, int(offset)) : max(0, int(offset)) + max(1, min(int(limit), 100))
            ]
        return matches

    def update_one(self, collection: str, query: dict, update: dict) -> bool:
        """更新单个文档"""
        collection = self._collection(collection)
        existing = self.find_one(collection, query)
        if not existing:
            return False
        existing.update(update)
        record_id = existing.pop("id")
        owner = existing.pop("owner_user_id", None)
        existing.pop("created_at", None)
        existing.pop("updated_at", None)
        now = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connection() as connection:
            connection.execute(
                f"UPDATE {collection} SET owner_user_id=?, payload=?, updated_at=? WHERE id=?",
                (owner, json.dumps(existing, ensure_ascii=False), now, record_id),
            )
        return True

    def delete_one(self, collection: str, query: dict) -> bool:
        """删除单个文档"""
        collection = self._collection(collection)
        existing = self.find_one(collection, query)
        if not existing:
            return False
        with self._lock, self._connection() as connection:
            connection.execute(
                f"DELETE FROM {collection} WHERE id=?", (existing["id"],)
            )
        return True

    def ping(self):
        with self._connection() as connection:
            return connection.execute("SELECT 1").fetchone()[0] == 1

    def scan(self, collection: str) -> list:
        """后台维护任务使用的全量扫描；在线列表接口仍必须分页。"""
        collection = self._collection(collection)
        with self._connection() as connection:
            return [
                self._decode(row)
                for row in connection.execute(
                    f"SELECT * FROM {collection} ORDER BY created_at ASC"
                )
            ]


# 全局数据存储实例
db = DataStore()
