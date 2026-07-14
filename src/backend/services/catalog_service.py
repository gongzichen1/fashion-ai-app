"""公共服装目录盘点、导入与推荐配图匹配。"""

import hashlib
from pathlib import Path

from PIL import Image
from sqlalchemy.exc import IntegrityError

ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
REVIEW_STATUSES = {"pending_rights_review", "approved"}


def _sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _inspect_image(path):
    try:
        with Image.open(path) as image:
            image.load()
            width, height = image.size
            image_format = (image.format or path.suffix.lstrip(".")).lower()
            sample = image.convert("L")
            sample.thumbnail((256, 256))
            entropy = round(sample.entropy(), 3)
            pixels = sample.tobytes()
            sample_width, sample_height = sample.size
            difference = 0
            comparisons = 0
            for y in range(sample_height):
                for x in range(sample_width):
                    index = y * sample_width + x
                    if x + 1 < sample_width:
                        difference += abs(pixels[index] - pixels[index + 1])
                        comparisons += 1
                    if y + 1 < sample_height:
                        difference += abs(pixels[index] - pixels[index + sample_width])
                        comparisons += 1
            neighbor_delta = round(difference / max(comparisons, 1), 3)
    except (OSError, ValueError):
        return {
            "width": 0,
            "height": 0,
            "format": "invalid",
            "entropy": 0.0,
            "neighbor_delta": 0.0,
            "review_status": "rejected_test_asset",
            "review_reason": "invalid_image",
        }

    reasons = []
    if width < 64 or height < 64:
        reasons.append("too_small")
    if entropy < 2.0:
        reasons.append("low_visual_entropy")
    if neighbor_delta > 25:
        reasons.append("high_frequency_noise")
    return {
        "width": width,
        "height": height,
        "format": "jpg" if image_format == "jpeg" else image_format,
        "entropy": entropy,
        "neighbor_delta": neighbor_delta,
        "review_status": (
            "rejected_test_asset" if reasons else "pending_rights_review"
        ),
        "review_reason": ",".join(reasons) if reasons else "rights_review_required",
    }


def inventory_directory(source_dir):
    """按内容哈希去重，只盘点目录顶层，避免把已导入 catalog 再次扫描。"""
    root = Path(source_dir).resolve()
    groups = {}
    for path in sorted(root.iterdir()):
        if not path.is_file() or path.suffix.lower() not in ALLOWED_SUFFIXES:
            continue
        content_hash = _sha256(path)
        group = groups.setdefault(
            content_hash,
            {
                "content_hash": content_hash,
                "representative": path.name,
                "files": [],
            },
        )
        group["files"].append(path.name)

    items = []
    for group in groups.values():
        inspected = _inspect_image(root / group["representative"])
        items.append(
            {
                **group,
                **inspected,
                "duplicate_count": len(group["files"]),
            }
        )
    items.sort(key=lambda item: item["content_hash"])
    return {
        "source_dir": str(root),
        "total_files": sum(item["duplicate_count"] for item in items),
        "unique_items": len(items),
        "candidates": sum(
            item["review_status"] == "pending_rights_review" for item in items
        ),
        "rejected_test_assets": sum(
            item["review_status"] == "rejected_test_asset" for item in items
        ),
        "items": items,
    }


def import_catalog_directory(
    store,
    storage,
    source_dir,
    review_status="pending_rights_review",
    source="legacy_uploads",
    rights_confirmed=False,
    metadata_by_hash=None,
):
    """将去重候选导入独立 catalog 前缀；默认不可被在线用户看到。"""
    if review_status not in REVIEW_STATUSES:
        raise ValueError("不支持的目录审核状态")
    inventory = inventory_directory(source_dir)
    metadata_by_hash = metadata_by_hash or {}
    approved_metadata = [
        metadata_by_hash.get(item["content_hash"], {})
        for item in inventory["items"]
        if metadata_by_hash.get(item["content_hash"], {}).get(
            "review_status", review_status
        )
        == "approved"
    ]
    if (review_status == "approved" or approved_metadata) and not rights_confirmed:
        raise ValueError("导入 approved 目录必须显式确认图片使用授权")
    if any(item.get("license_status") != "approved" for item in approved_metadata):
        raise ValueError("manifest 中 approved 图片必须标记 license_status=approved")
    if any(
        not item.get("category") or not item.get("garment_type")
        for item in approved_metadata
    ):
        raise ValueError("manifest 中 approved 图片必须填写 category 和 garment_type")

    root = Path(inventory["source_dir"])
    stats = {"created": 0, "existing": 0, "rejected": 0, "failed": 0}
    for item in inventory["items"]:
        if item["review_status"] == "rejected_test_asset":
            stats["rejected"] += 1
            continue
        metadata = metadata_by_hash.get(item["content_hash"], {})
        item_review_status = metadata.get("review_status", review_status)
        if item_review_status == "rejected_test_asset":
            stats["rejected"] += 1
            continue
        if item_review_status not in REVIEW_STATUSES:
            stats["failed"] += 1
            continue
        if store.find_one("catalog_items", {"content_hash": item["content_hash"]}):
            stats["existing"] += 1
            continue
        suffix = item["format"] if item["format"] in {"jpg", "png", "webp"} else "jpg"
        object_key = f"catalog/original/{item['content_hash']}.{suffix}"
        try:
            storage.upload(str(root / item["representative"]), object_key)
            store.insert(
                "catalog_items",
                {
                    "content_hash": item["content_hash"],
                    "review_status": item_review_status,
                    "category": metadata.get("category", ""),
                    "garment_type": metadata.get("garment_type", ""),
                    "imageKey": object_key,
                    "source": source,
                    "license_status": metadata.get("license_status", "unreviewed"),
                    "originalFilename": item["representative"],
                    "width": item["width"],
                    "height": item["height"],
                    "duplicateCount": item["duplicate_count"],
                    "name": metadata.get("name", ""),
                    "color_name": metadata.get("color_name", ""),
                    "material": metadata.get("material", ""),
                    "pattern": metadata.get("pattern", ""),
                    "styles": metadata.get("styles", []),
                    "scenes": metadata.get("scenes", []),
                    "seasons": metadata.get("seasons", []),
                },
            )
            stats["created"] += 1
        except IntegrityError:
            stats["existing"] += 1
        except Exception:
            stats["failed"] += 1
    return {**stats, "inventory": inventory}


def enrich_recommendations(recommendations, catalog_items):
    """只为有明确结构化匹配的推荐绑定审核通过的目录图片。"""
    used = set()
    enriched = []
    for recommendation in recommendations:
        best = None
        best_score = 0
        for item in catalog_items:
            if item.get("id") in used or item.get("review_status") != "approved":
                continue
            score = _catalog_score(recommendation, item)
            if score > best_score:
                best, best_score = item, score
        value = dict(recommendation)
        if best and best_score >= 40:
            used.add(best["id"])
            value["catalogItemId"] = best["id"]
            value["image"] = f"/api/catalog/{best['id']}/image"
        enriched.append(value)
    return enriched


def _catalog_score(recommendation, item):
    desired_type = str(recommendation.get("type") or "").strip().lower()
    desired_name = str(recommendation.get("name") or "").strip().lower()
    catalog_types = {
        str(item.get("category") or "").strip().lower(),
        str(item.get("garment_type") or "").strip().lower(),
    } - {""}
    score = 0
    if desired_type in catalog_types:
        score += 50
    elif any(value and value in desired_name for value in catalog_types):
        score += 40
    if recommendation.get("color") and recommendation.get("color") == item.get(
        "color_name"
    ):
        score += 20
    score += 10 * len(
        set(recommendation.get("scenes") or []) & set(item.get("scenes") or [])
    )
    score += 10 * len(
        set(recommendation.get("tags") or []) & set(item.get("styles") or [])
    )
    return score
