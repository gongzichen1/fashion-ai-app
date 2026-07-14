#!/usr/bin/env python3
"""盘点旧服装图片，输出去重和待授权审核清单，不修改任何图片。"""

import argparse
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "src" / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from services.catalog_service import inventory_directory


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if not args.source_dir.is_dir():
        parser.error("图片目录不存在")

    inventory = inventory_directory(args.source_dir)
    payload = json.dumps(inventory, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)
    print(
        "catalog_inventory",
        f"files={inventory['total_files']}",
        f"unique={inventory['unique_items']}",
        f"candidates={inventory['candidates']}",
        f"rejected={inventory['rejected_test_assets']}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
