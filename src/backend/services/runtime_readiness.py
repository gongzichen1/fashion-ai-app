"""生产依赖写入探针；只用于发布前显式验证，不在普通 health 请求中写数据。"""

import json
import os
import tempfile
import uuid
from datetime import datetime, timezone

from sqlalchemy import select


def verify_database_write(store):
    """在回滚事务中验证业务表的 INSERT/SELECT 权限。"""
    table = store.tables["feedback"]
    probe_id = f"probe-{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc).isoformat()
    connection = store.engine.connect()
    transaction = connection.begin()
    try:
        connection.execute(
            table.insert().values(
                id=probe_id,
                owner_user_id=None,
                payload=json.dumps({"kind": "runtime_write_probe"}),
                created_at=now,
                updated_at=now,
            )
        )
        found = connection.execute(
            select(table.c.id).where(table.c.id == probe_id)
        ).scalar_one_or_none()
        return found == probe_id
    except Exception:
        return False
    finally:
        transaction.rollback()
        connection.close()


def verify_storage_write(storage):
    """写入、读取并删除随机探针对象，验证私有桶完整生命周期。"""
    key = f"healthchecks/{uuid.uuid4().hex}.txt"
    expected = uuid.uuid4().hex.encode("ascii")
    path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False) as probe:
            probe.write(expected)
            path = probe.name
        storage.upload(path, key)
        body, _ = storage.read(key)
        return body == expected and storage.delete(key) is True
    except Exception:
        return False
    finally:
        try:
            storage.delete(key)
        except Exception:
            pass
        if path:
            try:
                os.remove(path)
            except FileNotFoundError:
                pass
