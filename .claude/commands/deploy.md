---
description: Deploy to Cloudflare Workers with verification (following CLAUDE.md commitments)
allowed-tools: Bash(pnpm:*), Bash(npx wrangler:*), Bash(curl:*), TodoWrite
---

# 部署到 Cloudflare Workers

**严格遵循 CLAUDE.md 中的"部署验证承诺"，按顺序执行以下步骤：**

## 步骤 1: 构建项目

```bash
pnpm build
```

✅ **验证标准**：
- 检查构建输出包含 "Built in Xms" 或类似成功消息
- 确认 `public/` 目录已生成或更新
- 无构建错误或警告

---

## 步骤 2: 部署到 Cloudflare

```bash
npx wrangler deploy
```

✅ **验证标准**：
- 确认输出包含 "Published" 或 "Uploaded" 成功消息
- 检查无 ERROR 级别日志
- 确认部署的 Workers 域名（如 `mana.workers.dev`）

---

## 步骤 3: 验证部署成功

```bash
curl -I https://mana.feihe.workers.dev
```

✅ **验证标准**：
- HTTP 状态码必须是 `200`
- 检查响应头包含 `server: cloudflare` 或类似标识

---

## ⚠️ 重要提醒

- **所有三个步骤都必须完成并验证成功**，才能标记部署为完成
- 如果任何一步失败，**停止执行**，向用户报告错误
- 不要跳过验证步骤
- 使用 TodoWrite 工具正确追踪每个步骤的完成状态

---

## 相关文档

详细承诺请参阅：`CLAUDE.md` 中的"部署验证承诺"章节
