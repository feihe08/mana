# Mana 安全措施文档

**创建时间**: 2026-01-31
**最后更新**: 2026-01-31

---

## 🔒 已实施的安全措施

### 1. 文件上传安全

#### 文件大小限制
- **最大文件大小**: 10MB
- **实现位置**: `app/lib/utils/file-validation.ts`
- **验证时机**: 文件上传前（客户端）+ 服务端接收后

```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

#### 文件类型验证
- **允许的扩展名**: `.csv`, `.xlsx`, `.xls`, `.txt`
- **允许的 MIME 类型**:
  - `text/csv`
  - `text/plain`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `application/octet-stream`
- **双重验证**: 扩展名 + MIME 类型

#### 空文件检测
- 拒绝大小为 0 的文件
- 防止恶意空文件攻击

### 2. 数据验证

#### 金额验证
- **范围限制**: 0.01 ~ 10,000,000
- **类型检查**: 必须为有效数字
- **防止**: 注入攻击、数据溢出

```typescript
// 金额不能为 0（可以是很小的正数或负数）
if (Math.abs(numAmount) < 0.01) {
  return false;
}

// 金额不能过大（单笔交易不超过 1000 万）
if (Math.abs(numAmount) > 10_000_000) {
  return false;
}
```

#### 日期验证
- **范围限制**: 1990-01-01 ~ 2030-12-31
- **格式检查**: 必须为有效日期字符串
- **防止**: 时间戳注入、无效日期

#### 必填字段验证
- `description`: 必须为非空字符串
- `amount`: 必须为有效数字
- `transactionDate`: 必须为有效日期

### 3. 数据清理

#### 自动清理无效记录
- **实现位置**: `app/lib/utils/data-validation.ts`
- **功能**: 自动过滤无效账单记录
- **日志**: 记录清理的记录数量

```typescript
const { valid: cleanBills, invalid } = sanitizeBills(bills);
if (invalid > 0) {
  console.warn(`清理了 ${invalid} 条无效记录，保留 ${cleanBills.length} 条有效记录`);
}
```

### 4. 错误处理

#### 友好的错误提示
- 不暴露内部实现细节
- 提供用户可操作的建议
- 记录详细错误日志（仅服务端）

#### 错误分类
- 文件验证错误
- 数据验证错误
- 解析错误
- 服务器错误

### 5. 存储安全

#### Cloudflare R2 存储
- **原始文件**: 存储在 R2 bucket
- **访问控制**: 通过 API 端点控制访问
- **文件命名**: 使用随机 ID，防止路径遍历

```typescript
const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
```

#### Cloudflare D1 数据库
- **参数化查询**: 防止 SQL 注入
- **数据加密**: Cloudflare 自动加密
- **访问控制**: 仅通过 Worker 访问

---

## ⚠️ 待实施的安全措施

### 1. CSRF 保护

**优先级**: P1（中）

**原因**:
- 当前应用主要是客户端操作（文件上传、数据转换）
- 没有敏感的状态修改操作（如转账、删除账户）
- 使用 Cloudflare Workers，默认有一定的 CSRF 防护

**建议实施方案**:
```typescript
// 1. 生成 CSRF Token
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

// 2. 验证 CSRF Token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// 3. 在表单中添加 CSRF Token
<input type="hidden" name="csrf_token" value={csrfToken} />
```

**实施时机**:
- 添加用户认证后
- 添加敏感操作（如删除账单、修改设置）后

### 2. XSS 防护增强

**优先级**: P1（中）

**当前状态**:
- React 默认转义输出，防止大部分 XSS
- 数据验证已过滤无效字符

**建议增强**:
```typescript
// 1. 添加 HTML 转义函数
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 2. 清理用户输入
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}
```

**实施时机**:
- 添加用户评论功能后
- 添加自定义分类名称后

### 3. 速率限制

**优先级**: P2（低）

**原因**:
- 防止暴力攻击
- 防止资源滥用

**建议实施方案**:
```typescript
// 使用 Cloudflare Workers KV 存储请求计数
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  limit: number = 100,
  window: number = 60
): Promise<boolean> {
  const key = `rate-limit:${ip}`;
  const count = await kv.get(key);

  if (count && parseInt(count) >= limit) {
    return false;
  }

  await kv.put(key, (parseInt(count || '0') + 1).toString(), {
    expirationTtl: window,
  });

  return true;
}
```

**实施时机**:
- 用户量增长后
- 发现滥用行为后

### 4. 内容安全策略 (CSP)

**优先级**: P2（低）

**建议配置**:
```typescript
// 在 Worker 响应中添加 CSP 头
headers.set('Content-Security-Policy', [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com",
].join('; '));
```

### 5. 安全响应头

**优先级**: P2（低）

**建议添加**:
```typescript
// X-Frame-Options: 防止点击劫持
headers.set('X-Frame-Options', 'DENY');

// X-Content-Type-Options: 防止 MIME 类型嗅探
headers.set('X-Content-Type-Options', 'nosniff');

// Referrer-Policy: 控制 Referer 头
headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

// Permissions-Policy: 限制浏览器功能
headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
```

---

## 🔍 安全审计清单

### 文件上传
- [x] 文件大小限制
- [x] 文件类型验证
- [x] 空文件检测
- [ ] 文件内容扫描（病毒检测）
- [ ] 文件名清理（防止路径遍历）

### 数据验证
- [x] 金额范围验证
- [x] 日期范围验证
- [x] 必填字段验证
- [x] 数据类型验证
- [ ] 字符串长度限制
- [ ] 特殊字符过滤

### API 安全
- [x] 错误处理
- [x] 参数验证
- [ ] CSRF 保护
- [ ] 速率限制
- [ ] API 密钥验证（AI API）

### 存储安全
- [x] 随机文件名
- [x] 参数化查询
- [ ] 数据加密（敏感字段）
- [ ] 访问日志

### 前端安全
- [x] React 自动转义
- [ ] XSS 防护增强
- [ ] CSP 配置
- [ ] 安全响应头

---

## 📊 安全评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **文件上传安全** | ⭐⭐⭐⭐⭐ | 完善的验证机制 |
| **数据验证** | ⭐⭐⭐⭐⭐ | 严格的数据验证 |
| **存储安全** | ⭐⭐⭐⭐ | 使用 Cloudflare 安全服务 |
| **API 安全** | ⭐⭐⭐ | 基础安全措施，待增强 |
| **前端安全** | ⭐⭐⭐⭐ | React 默认防护，待增强 |

**整体评分**: 4.2/5

**评价**:
- 核心安全措施已到位
- 适合当前 MVP 阶段
- 后续可根据需求逐步增强

---

## 🚀 安全实施路线图

### Phase 1: MVP 发布前（当前）
- [x] 文件上传验证
- [x] 数据验证
- [x] 错误处理
- [x] 存储安全

### Phase 2: 用户增长期（1-3个月）
- [ ] CSRF 保护
- [ ] XSS 防护增强
- [ ] 速率限制
- [ ] 安全响应头

### Phase 3: 成熟期（3-6个月）
- [ ] 用户认证
- [ ] 权限管理
- [ ] 审计日志
- [ ] 安全监控

---

## 📝 安全最佳实践

### 开发规范
1. **永远不要信任用户输入** - 所有输入必须验证
2. **最小权限原则** - 只授予必要的权限
3. **纵深防御** - 多层安全措施
4. **安全默认** - 默认配置应该是安全的

### 代码审查
1. 检查所有用户输入点
2. 验证所有数据库查询
3. 审查文件操作
4. 检查错误处理

### 部署检查
1. 环境变量不包含敏感信息
2. 生产环境禁用调试模式
3. 启用 HTTPS
4. 配置安全响应头

---

**维护者**: Hefei
**最后审计**: 2026-01-31
