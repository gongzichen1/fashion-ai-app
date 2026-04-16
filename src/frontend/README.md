# 智搭小程序 - 前端

## 项目说明

这是智搭智能穿搭助手的微信小程序前端项目。

## 导入项目

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

2. 打开微信开发者工具，选择「导入项目」

3. 项目目录选择当前文件夹

4. 填入小程序AppID（可在微信公众平台获取，或使用测试号）

## 配置说明

### 修改API地址

编辑 `app.js`，修改 `apiBaseUrl`：

```javascript
globalData: {
  apiBaseUrl: 'http://localhost:5000/api',  // 开发环境
  // apiBaseUrl: 'https://your-domain.com/api',  // 生产环境
}
```

### 修改主题色

编辑 `app.wxss`，修改CSS变量：

```css
page {
  --primary-color: #FF6B9D;
  --primary-light: #FFE4EC;
}
```

## 页面说明

| 页面 | 路径 | 说明 |
|-----|------|------|
| 首页 | pages/index | 产品介绍和快捷入口 |
| 拍照 | pages/camera | 拍摄/上传服装图片 |
| 结果 | pages/result | 查看分析结果和推荐 |
| 我的 | pages/profile | 个人中心和设置 |

## 开发说明

### 添加新页面

1. 在 `pages/` 下创建新文件夹
2. 创建页面文件：`.js`, `.json`, `.wxml`, `.wxss`
3. 在 `app.json` 的 `pages` 数组中添加页面路径

### 添加组件

1. 在 `components/` 下创建组件文件夹
2. 创建组件文件
3. 在页面的 `.json` 文件中注册组件

## 注意事项

- 开发时请在开发者工具中勾选「不校验合法域名」
- 生产环境需要配置服务器域名
- 图片资源需要自行添加到 `images/` 目录
