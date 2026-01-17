# 内容库数据同步脚本

## 功能说明

该脚本用于从后端接口获取内容库数据，并将数据写入到 `src/mock/familiarMockData.js` 文件中。

## 使用方法

### 方法1：使用 npm 命令（推荐）

```bash
npm run sync:content <your-token>
```

### 方法2：直接运行脚本

```bash
node scripts/sync-content-library.js <your-token>
```

### 参数说明

- `<your-token>`: 必填，用户的认证 token（从浏览器开发者工具或小程序调试工具中获取）

## 获取 Token 的方法

### 在微信开发者工具中获取

1. 打开微信开发者工具
2. 运行小程序并登录
3. 打开调试器 → Network 标签
4. 找到任意 API 请求
5. 查看 Request Headers 中的 `Authorization` 字段值
6. 复制该值作为 token 使用

### 在浏览器中获取（如果有 H5 版本）

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面并登录
4. 找到任意 API 请求
5. 查看 Request Headers 中的 `Authorization` 字段值
6. 复制该值作为 token 使用

## 示例

```bash
# 假设你的 token 是 "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
npm run sync:content "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 执行流程

1. 脚本调用 `GET https://mini.997555.xyz/api/fourModule/getAllContent` 接口
2. 使用提供的 token 进行认证
3. 获取内容库数据列表
4. 将数据格式化为 JavaScript 代码
5. 追加到 `src/mock/familiarMockData.js` 文件末尾

## 输出内容

脚本会在 `familiarMockData.js` 文件末尾生成以下内容：

- `CONTENT_LIBRARY_DATA`: 所有内容库数据数组
- `CONTENT_LIBRARY_BY_WAREHOUSE`: 按仓库ID分组的内容数据
- `getContentsByWarehouse(warehouseId)`: 根据仓库ID获取内容的辅助函数
- `getContentByCode(contentCode)`: 根据内容编码获取内容的辅助函数
- `getContentById(id)`: 根据ID获取内容的辅助函数

## 注意事项

1. **Token 有效期**: Token 可能会过期，如果脚本执行失败提示认证错误，请重新获取 token
2. **数据覆盖**: 每次执行脚本会移除之前自动生成的数据，然后追加新数据
3. **手动修改**: 请勿手动修改自动生成的部分（有注释标记），否则下次执行脚本时会被覆盖
4. **网络连接**: 确保能够访问 `https://mini.997555.xyz`

## 故障排查

### 提示 "需要提供认证 token"

- 确保在命令行中提供了 token 参数
- Token 需要用引号包裹，特别是包含特殊字符时

### 提示 "HTTP 请求失败: 401"

- Token 无效或已过期，请重新获取

### 提示 "HTTP 请求失败: 404"

- 接口路径可能已更改，请检查后端接口文档

### 提示 "文件写入失败"

- 检查文件权限
- 确保 `src/mock/familiarMockData.js` 文件存在且可写

## 技术细节

- 使用 Node.js 原生模块（https, fs, path），无需额外依赖
- 支持自动移除旧的自动生成数据
- 数据格式化为易读的 JavaScript 代码
- 包含时间戳和数据来源注释
