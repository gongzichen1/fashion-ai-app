# 公共服装图片目录

## 1. 定位和边界

公共服装目录用于给 AI 搭配建议提供经过授权、审核和结构化标注的真实配图。它与用户私人衣橱完全分离：

- `catalog_items`：企业维护的公共目录，所有已登录用户可查看 `approved` 单品；
- `wardrobe_items`：用户明确加入的私人衣橱，始终绑定 `owner_user_id`；
- `results`：用户每次上传和分析的记录，原图默认保留 30 天；
- 旧 `uploads/`：历史运行目录，不代表已授权公共素材。

禁止把用户上传、来源不明真人图片或测试图片直接设为 `approved`。公共目录图片使用私有 COS 的 `catalog/original/` 前缀，前端只能通过 `/api/catalog/<id>/image` 的登录鉴权代理读取。

## 2. 当前素材盘点

2026-07-14 对 `src/backend/uploads` 的只读盘点结果：

- 文件：45；
- 按 SHA-256 去重后：18；
- 自动拒绝测试资产：6，包括 1×1/60×80 小图、低信息纯色色块和高频随机噪声；
- 待授权人工复核：12；
- 自动批准：0。

该结果只说明技术可用性，不证明图片来源、肖像权或商业使用权。

## 3. 盘点与人工复核

清单应输出到仓库外的受控目录：

```bash
.venv/bin/python scripts/inventory_clothing_library.py \
  src/backend/uploads \
  --output /secure/catalog-review.json
chmod 600 /secure/catalog-review.json
```

工具只读取图片，不修改源文件、数据库或对象存储。它记录内容哈希、尺寸、熵、邻域差异、重复文件和初始审核状态。

人工复核每个候选项后，只有确认授权且适合作为公共搭配素材的项目才改为：

```json
{
  "review_status": "approved",
  "license_status": "approved",
  "category": "外套",
  "garment_type": "风衣",
  "name": "米色通勤风衣",
  "color_name": "米色",
  "material": "棉混纺",
  "pattern": "纯色",
  "styles": ["通勤", "简约"],
  "scenes": ["通勤", "日常"],
  "seasons": ["春", "秋"]
}
```

不采用的图片改为 `rejected_test_asset`。不得删除 `content_hash`，它是去重和幂等导入依据。

## 4. 导入数据库与私有 COS

默认导入保持 `pending_rights_review`，因此在线不可见：

```bash
PYTHONPATH=src/backend FLASK_APP=app .venv/bin/flask catalog-import \
  src/backend/uploads \
  --manifest /secure/catalog-review.json
```

只有人工清单已完成授权和标签审核时，才允许增加 `--confirm-approved-rights`。

命令有以下硬约束：

- 以 SHA-256 唯一索引保证重复执行幂等；
- 小图、纯色色块、随机噪声等测试资产不导入；
- `approved` 条目必须同时具有 `license_status=approved`、`category` 和 `garment_type`；
- 图片写入 `catalog/original/<sha256>.<ext>`；
- 数据库只保存 COS key 和结构化元数据，不保存图片二进制；
- 未审核项目不会出现在 `/api/catalog` 或推荐结果中。

## 5. 在线使用

分析和推荐接口会读取最多 100 个审核通过的目录单品，根据推荐品类、颜色、场景和风格做结构化匹配。只有达到最低匹配分数时，推荐项才增加：

```json
{
  "catalogItemId": "...",
  "image": "/api/catalog/<id>/image"
}
```

没有可靠匹配时继续显示文字建议或默认衣服图标，不随机塞入无关图片。目录不包含价格、品牌和购买链接；接入真实商品源前不得宣传商品推荐能力。

## 6. 验收

- 未登录访问目录和图片返回 401；
- `pending_rights_review` 和拒绝项对在线用户返回 404；
- API 不返回 `imageKey`、内容哈希、原始文件名或内部来源；
- 同一内容重复导入不会产生重复记录；
- 私有 COS 无效时 health 和发布验证失败；
- 目录图片不能自动进入任何用户的 `wardrobe_items`；
- 推荐配图必须与推荐品类有明确结构化匹配。
