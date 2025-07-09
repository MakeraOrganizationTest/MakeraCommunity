# Cloudflare R2 CORS 配置指南

## 概述

当使用预签名 URL 直接从浏览器上传文件到 Cloudflare R2 时，需要正确配置 CORS（跨源资源共享）策略，否则会遇到 CORS 错误。

## 🚨 常见错误信息

```
Access to fetch at 'https://your-bucket.r2.cloudflarestorage.com/...'
from origin 'https://your-domain.com' has been blocked by CORS policy
```

## 📋 配置步骤

### 1. 登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的账户
3. 进入 **R2 Object Storage**

### 2. 选择存储桶

1. 点击你要配置的存储桶名称
2. 进入存储桶详情页面

### 3. 配置 CORS 策略

1. 点击 **Settings** 标签页
2. 找到 **CORS Policy** 部分
3. 点击 **Edit CORS policy**

### 4. 添加 CORS 规则

粘贴以下 JSON 配置：

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5. 生产环境配置

对于生产环境，请使用更严格的配置：

```json
[
  {
    "AllowedOrigins": ["https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "Authorization",
      "x-amz-acl",
      "x-amz-content-sha256",
      "x-amz-date"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 🔧 配置参数说明

| 参数             | 说明                 | 示例                      |
| ---------------- | -------------------- | ------------------------- |
| `AllowedOrigins` | 允许访问的域名列表   | `["https://example.com"]` |
| `AllowedMethods` | 允许的 HTTP 方法     | `["GET", "PUT", "POST"]`  |
| `AllowedHeaders` | 允许的请求头         | `["Content-Type", "*"]`   |
| `ExposeHeaders`  | 暴露给客户端的响应头 | `["ETag"]`                |
| `MaxAgeSeconds`  | 预检请求的缓存时间   | `3600`                    |

## 🛠️ 环境变量配置

确保在 `.env.local` 中正确配置：

```bash
# R2 基本配置
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com

# 如果需要公开访问，配置自定义域名
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-custom-domain.com
```

## 🔍 调试步骤

### 1. 检查浏览器控制台

按 `F12` 打开开发者工具，查看 Console 和 Network 标签页中的错误信息。

### 2. 验证 CORS 配置

使用浏览器发送测试请求：

```javascript
// 在浏览器控制台中运行
fetch('https://your-bucket.r2.cloudflarestorage.com/', {
  method: 'OPTIONS'
})
  .then(response => {
    console.log('CORS Headers:', response.headers)
  })
  .catch(error => {
    console.error('CORS Error:', error)
  })
```

### 3. 检查请求头

确保客户端发送的请求头与预签名 URL 签名时使用的头部匹配：

```javascript
// 正确的上传请求
const xhr = new XMLHttpRequest()
xhr.open('PUT', presignedUrl)
xhr.setRequestHeader('Content-Type', file.type)
xhr.setRequestHeader('x-amz-acl', 'private')
xhr.send(file)
```

## ⚡ 快速解决方案

如果仍然遇到 CORS 错误，尝试以下步骤：

### 1. 简化 CORS 配置（仅用于测试）

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["*"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

> ⚠️ **警告**：此配置仅用于调试，生产环境请使用严格的配置。

### 2. 清除浏览器缓存

- 清除浏览器缓存和 Cookie
- 或使用无痕模式测试

### 3. 等待配置生效

CORS 配置更改可能需要几分钟才能生效。

## 📞 常见问题

### Q: 为什么本地开发可以，生产环境不行？

A: 检查 `AllowedOrigins` 中是否包含了生产环境的域名。

### Q: 为什么预检请求失败？

A: 确保 `AllowedMethods` 包含 `OPTIONS` 方法，或者在 `AllowedHeaders` 中使用 `"*"`。

### Q: 上传成功但无法访问文件？

A: 这是权限问题，不是 CORS 问题。检查存储桶的公开访问设置。

## 🔗 相关链接

- [Cloudflare R2 CORS 文档](https://developers.cloudflare.com/r2/api/s3/api/#cors)
- [AWS S3 CORS 配置参考](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [MDN CORS 指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
