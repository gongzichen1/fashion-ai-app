"""图片保留期维护任务。"""

import time


def cleanup_expired_images(store, storage, now=None):
    """删除未被收藏或衣橱引用的到期原图，并保留分析元数据。"""
    cutoff = int(now if now is not None else time.time())
    stats = {"scanned": 0, "deleted": 0, "retained": 0, "failed": 0}
    for result in store.scan("results"):
        stats["scanned"] += 1
        expires_at = result.get("expiresAt")
        image_key = result.get("imageKey")
        if not image_key or not expires_at or int(expires_at) > cutoff:
            continue
        query = {"id": result["id"], "owner_user_id": result.get("owner_user_id")}
        retained = any(
            store.find_one(collection, query)
            for collection in ("favorites", "wardrobe_items")
        )
        if retained:
            stats["retained"] += 1
            continue
        try:
            storage.delete(image_key)
            store.update_one(
                "results",
                query,
                {"image": "", "imageKey": "", "imageExpiredAt": cutoff},
            )
            stats["deleted"] += 1
        except Exception:
            stats["failed"] += 1
    return stats
