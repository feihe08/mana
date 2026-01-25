# Mana 云端存储 + 统计分析页面实现计划

## 目标
1. 实现云端存储（替代 localStorage）
2. 实现统计分析页面
3. 支持：
   - 原始账单文件保存到 R2
   - 解析后的 bean 文件保存到 R2
   - 元数据保存到 D1
   - 统计分析从云端读取数据

---

## 架构设计

### 当前架构（localStorage）
```
用户上传文件 → 客户端解析 → 保存到 localStorage → 展示
```

### 新架构（Cloudflare）
```
用户上传文件
  → 客户端解析（现有逻辑）
  → 上传到 Cloudflare Workers
    → 原始文件保存到 R2 (raw-files/)
    → bean 文件保存到 R2 (bean-files/)
    → 元数据保存到 D1 (uploads 表)
  → 统计分析从 D1 + R2 读取
```

---

## 数据库设计（D1）

### 新表：uploads（替代现有 schema）

```sql
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,              -- 上传记录 ID
  original_filename TEXT NOT NULL,  -- 原始文件名
  file_type TEXT NOT NULL,          -- 'alipay', 'wechat', 'csv', 'excel'
  upload_date TEXT NOT NULL,        -- 上传时间

  -- R2 文件路径
  raw_file_key TEXT NOT NULL,       -- 原始文件在 R2 的路径
  bean_file_key TEXT NOT NULL,      -- bean 文件在 R2 的路径

  -- 统计信息
  transaction_count INTEGER NOT NULL,
  total_amount REAL NOT NULL,

  -- 可选：原始解析数据（JSON）
  parsed_data TEXT,                 -- JSON 数组，存储解析后的账单

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX idx_uploads_date ON uploads(upload_date);
CREATE INDEX idx_uploads_type ON uploads(file_type);
```

### 现有 bills 表不需要
- 原因：不需要逐笔存储，只存储汇总信息和文件引用
- bean 文件已经包含了所有交易数据

---

## R2 存储结构

```
mana-uploads/
├── raw-files/
│   ├── upload-1234567890/alipay_202501.csv
│   ├── upload-1234567891/wechat_202501.csv
│   └── ...
└── bean-files/
    ├── upload-1234567890/alipay_202501.bean
    ├── upload-1234567891/wechat_202501.bean
    └── ...
```

---

## 执行计划

### 阶段 1：基础设施准备（30分钟）

#### 1.1 创建项目 .claude 目录
```bash
mkdir -p /Users/hefei/Developer/mana/.claude/plans
cp /Users/hefei/.claude/plans/hidden-noodling-rainbow.md \
   /Users/hefei/Developer/mana/.claude/plans/analytics-implementation.md
rm /Users/hefei/.claude/plans/hidden-noodling-rainbow.md
```

#### 1.2 配置 Cloudflare 资源
```bash
# 创建 D1 数据库
wrangler d1 create mana-db
# 记录返回的 database_id

# 创建 R2 存储桶
wrangler r2 bucket create mana-uploads
```

#### 1.3 更新 wrangler.toml
```toml
# 取消注释并填入 database_id
[[d1_databases]]
binding = "DB"
database_name = "mana-db"
database_id = "从上一步获取的 ID"

# 取消注释
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "mana-uploads"
```

#### 1.4 创建数据库表
```bash
# 更新 schema.sql（创建 uploads 表）
# 然后执行
wrangler d1 execute mana-db --file=app/lib/db/schema.sql --local
wrangler d1 execute mana-db --file=app/lib/db/schema.sql  # 生产环境
```

---

### 阶段 2：服务层实现（2小时）

#### 2.1 创建数据库操作层
文件：`app/lib/db/uploads.ts`

```typescript
// 需要实现的函数：
export async function saveUpload(db: D1Database, data: UploadData): Promise<string>
export async function getUploads(db: D1Database, filters?: UploadFilters): Promise<Upload[]>
export async function getUploadById(db: D1Database, id: string): Promise<Upload | null>
export async function deleteUpload(db: D1Database, id: string): Promise<boolean>
export async function getUploadStats(db: D1Database): Promise<UploadStats>
```

#### 2.2 创建文件存储服务
文件：`app/lib/storage/files.ts`

```typescript
// 需要实现的函数：
export async function saveRawFile(bucket: R2Bucket, uploadId: string, file: File): Promise<string>
export async function saveBeanFile(bucket: R2Bucket, uploadId: string, content: string): Promise<string>
export async function getBeanFile(bucket: R2Bucket, key: string): Promise<string>
export async function deleteUploadFiles(bucket: R2Bucket, uploadId: string): Promise<void>
```

---

### 阶段 3：API 实现（2小时）

#### 3.1 创建上传 API
文件：`app/routes/api.upload.ts`

```typescript
import type { Route } from './+types/api.upload';
import { getDB, getBucket } from '../lib/server';
import { saveUpload } from '../lib/db/uploads';
import { saveRawFile, saveBeanFile } from '../lib/storage/files';
import { convertBillsToBeancount } from '../lib/pipeline/conversion-pipeline';
import { parseBillFile, categorizeBills } from '../lib/client/parsers';

export async function action({ request, context }: Route.ActionArgs) {
  const db = getDB(context);
  const bucket = getBucket(context);

  // 1. 接收文件和解析后的数据
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const billsJson = formData.get('bills') as string; // 客户端解析的结果
  const bills = JSON.parse(billsJson);

  // 2. 生成上传 ID
  const uploadId = `upload-${Date.now()}`;

  // 3. 保存原始文件到 R2
  const rawKey = await saveRawFile(bucket, uploadId, file);

  // 4. 生成 beancount 内容
  const result = await convertBillsToBeancount(bills, { sourceType: 'auto' });

  // 5. 保存 bean 文件到 R2
  const beanKey = await saveBeanFile(bucket, uploadId, result.beancountContent);

  // 6. 保存元数据到 D1
  await saveUpload(db, {
    id: uploadId,
    original_filename: file.name,
    file_type: formData.get('fileType') as string,
    upload_date: new Date().toISOString(),
    raw_file_key: rawKey,
    bean_file_key: beanKey,
    transaction_count: bills.length,
    total_amount: bills.reduce((sum, b) => sum + b.amount, 0),
    parsed_data: billsJson,
  });

  // 7. 返回上传记录 ID
  return { uploadId, success: true };
}
```

#### 3.2 创建列表查询 API
文件：`app/routes/api.uploads.ts`

```typescript
import type { Route } from './+types/api.uploads';
import { getDB } from '../lib/server';
import { getUploads } from '../lib/db/uploads';

export async function loader({ context }: Route.LoaderArgs) {
  const db = getDB(context);
  const uploads = await getUploads(db);
  return { uploads };
}
```

#### 3.3 创建删除 API
文件：`app/routes/api.delete-upload.ts`

```typescript
import type { Route } from './+types/api.delete-upload';
import { getDB, getBucket } from '../lib/server';
import { deleteUpload as deleteFromDB } from '../lib/db/uploads';
import { deleteUploadFiles } from '../lib/storage/files';

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get('id') as string;

  const db = getDB(context);
  const bucket = getBucket(context);

  // 删除 D1 记录和 R2 文件
  await deleteFromDB(db, id);
  await deleteUploadFiles(bucket, id);

  return { success: true };
}
```

---

### 阶段 4：修改现有页面（1.5小时）

#### 4.1 修改 app/routes/_index.tsx

**变更点**：
1. 移除 `import { saveBills, getBillsHistory } from '../lib/client/storage';`
2. 表单提交改为 POST 到 `/api/upload`
3. 使用 `useActionData` 获取上传结果
4. 移除 `saveBills()` 调用

```tsx
// 修改前
const handleSubmit = async () => {
  const result = await convertBillsToBeancount(filteredBills, { sourceType: 'auto' });
  saveBills(fileName, filteredBills, result.beancountContent);
  setCurrentStep(3);
};

// 修改后
import { Form } from 'react-router';

const handleSubmit = () => {
  // 提交到 API
};

// 在 JSX 中
<Form method="post" action="/api/upload" enctype="multipart/form-data">
  <input type="file" name="file" />
  <input type="hidden" name="bills" value={JSON.stringify(categorizedBills)} />
  <input type="hidden" name="fileType" value="auto" />
  <button type="submit">上传并转换</button>
</Form>
```

#### 4.2 修改 app/routes/bills.tsx

**变更点**：
1. 添加 `loader` 从 API 获取数据
2. 使用 `<Form>` 替代 `handleDelete` 直接调用
3. 移除所有 `localStorage` 相关代码

```tsx
// 添加 loader
import { getDB } from '../lib/server';
import { getUploads } from '../lib/db/uploads';

export async function loader({ context }: Route.LoaderArgs) {
  const db = getDB(context);
  const uploads = await getUploads(db);
  return { uploads };
}

export default function BillsList() {
  const { uploads } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const deleteFetcher = useFetcher();

  // 删除操作
  const handleDelete = (id: string) => {
    if (confirm('确定删除？')) {
      deleteFetcher.submit({ id }, { method: 'post', action: '/api/delete-upload' });
    }
  };

  return (
    <div>
      {uploads.map(upload => (
        <div key={upload.id}>
          <h3>{upload.original_filename}</h3>
          <button onClick={() => handleDelete(upload.id)}>删除</button>
        </div>
      ))}
    </div>
  );
}
```

---

### 阶段 5：实现统计分析页面（2小时）

#### 5.1 创建 app/routes/analytics.tsx

**页面结构**：
```tsx
import { useLoaderData } from 'react-router';
import { getDB } from '../lib/server';
import { getUploads } from '../lib/db/uploads';
import {
  Treemap, BarChart, LineChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export async function loader({ context }: Route.LoaderArgs) {
  const db = getDB(context);
  const uploads = await getUploads(db);

  // 合并所有交易数据
  const allTransactions = uploads.flatMap(u =>
    JSON.parse(u.parsed_data || '[]')
  );

  // 聚合统计
  const stats = {
    totalAmount: allTransactions.reduce((sum, t) => sum + t.amount, 0),
    transactionCount: allTransactions.length,
    categoryBreakdown: groupByCategory(allTransactions),
    trendData: groupByDate(allTransactions),
  };

  return stats;
}

export default function Analytics() {
  const stats = useLoaderData<typeof loader>();

  return (
    <div>
      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="总支出" value={stats.totalAmount} />
        <StatCard label="交易笔数" value={stats.transactionCount} />
      </div>

      {/* Treemap */}
      <ResponsiveContainer width="100%" height={300}>
        <Treemap data={stats.categoryBreakdown} dataKey="value" />
      </ResponsiveContainer>

      {/* BarChart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats.categoryBreakdown.slice(0, 10)}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      {/* LineChart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={stats.trendData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="amount" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 5.2 安装 Recharts
```bash
pnpm add recharts
```

#### 5.3 添加路由
文件：`app/routes.ts`
```typescript
import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/_index.tsx"),
  route("/bills", "routes/bills.tsx"),
  route("/analytics", "routes/analytics.tsx"),  // 新增
  route("/convert/beancount", "routes/convert.beancount.tsx"),
] satisfies RouteConfig;
```

---

### 阶段 6：测试和部署（1小时）

#### 6.1 本地测试
```bash
# 1. 启动本地开发服务器
pnpm dev

# 2. 测试功能
# - 上传文件
# - 查看列表
# - 查看统计
# - 删除记录
```

#### 6.2 部署到 Cloudflare
```bash
# 1. 构建
pnpm build

# 2. 部署
npx wrangler deploy

# 3. 验证
curl https://mana.feihe.workers.dev/analytics
```

#### 6.3 清理
- 删除 `app/lib/client/storage.ts`
- 更新 PLAN.md 标记任务完成

---

## 实现步骤详细说明

### 步骤 0：创建项目级别的 .claude 目录
- [ ] 创建 D1 数据库：`wrangler d1 create mana-db`
- [ ] 创建 R2 存储桶：`wrangler r2 bucket create mana-uploads`
- [ ] 更新 wrangler.toml（取消注释 D1 和 R2 配置）
- [ ] 执行 schema.sql 创建表：`wrangler d1 execute mana-db --file=app/lib/db/schema.sql`

### 步骤 2：创建数据库操作层
文件：`app/lib/db/uploads.ts`

```typescript
// 需要实现的函数：
export async function saveUpload(db, data)
export async function getUploads(db, filters)
export async function getUploadById(db, id)
export async function deleteUpload(db, id)
export async function getUploadStats(db)
```

### 步骤 3：创建文件存储服务
文件：`app/lib/storage/files.ts`

```typescript
// 需要实现的函数：
export async function saveRawFile(bucket, fileId, file)
export async function saveBeanFile(bucket, fileId, beanContent)
export async function getBeanFile(bucket, fileKey)
export async function deleteFiles(bucket, fileId)
```

### 步骤 4：创建服务端 API（Actions）
文件：`app/routes/api.upload.ts`

```typescript
// POST /api/upload
export async function action({ request, context }) {
  // 1. 接收文件
  // 2. 调用现有解析逻辑（客户端解析或服务端解析）
  // 3. 保存原始文件到 R2
  // 4. 生成 bean 内容
  // 5. 保存 bean 文件到 R2
  // 6. 保存元数据到 D1
  // 7. 返回上传记录 ID
}
```

### 步骤 5：创建查询 API（Loaders）
文件：`app/routes/api.list-uploads.ts`

```typescript
// GET /api/uploads
export async function loader({ context }) {
  // 1. 从 D1 查询所有上传记录
  // 2. 返回列表（分页）
}
```

### 步骤 6：修改现有页面

#### 6.1 修改 `app/routes/_index.tsx`
- [ ] 移除 `localStorage` 相关代码
- [ ] 表单提交改为 POST 到 `/api/upload`
- [ ] 使用 `useActionData` 和 `useNavigation` 处理上传状态

#### 6.2 修改 `app/routes/bills.tsx`
- [ ] 从 loader 获取数据（而不是 localStorage）
- [ ] 使用 `useFetcher` 或 `<Form>` 进行删除操作

### 步骤 7：实现统计分析页面
文件：`app/routes/analytics.tsx`

#### 7.1 页面结构
```tsx
// 概览卡片
本月支出、上月支出、交易笔数

// 图表区域
<Treemap data={categoryData} />
<BarChart data={topCategories} />
<LineChart data={trendData} />

// 筛选器
时间范围选择、分类选择
```

#### 7.2 数据获取逻辑
```typescript
export async function loader({ context }) {
  // 1. 从 D1 获取所有 uploads 记录
  const uploads = await getUploads(context.env.DB);

  // 2. 从 R2 读取所有 bean 文件内容（可选）
  // 或者直接从 uploads.parsed_data 读取

  // 3. 合并所有交易数据
  const allTransactions = uploads.flatMap(u =>
    JSON.parse(u.parsed_data)
  );

  // 4. 聚合统计
  const stats = {
    categoryBreakdown: groupByCategory(allTransactions),
    trendData: groupByDate(allTransactions),
    totalAmount: calculateTotal(allTransactions)
  };

  return stats;
}
```

#### 7.3 图表组件
```typescript
// 安装依赖
pnpm add recharts

// 图表实现
<Treemap width={400} height={200} data={categoryData} />
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={barData}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#8884d8" />
  </BarChart>
</ResponsiveContainer>
```

### 步骤 8：数据迁移（可选）
- [ ] 提供 localStorage → Cloudflare 的迁移工具
- [ ] 在设置页面添加"导出到云端"按钮

---

## 关键文件清单

### 需要创建的文件
1. `app/lib/db/uploads.ts` - D1 操作
2. `app/lib/storage/files.ts` - R2 操作
3. `app/routes/api.upload.ts` - 上传 API
4. `app/routes/api.uploads.ts` - 列表 API
5. `app/routes/api.delete-upload.ts` - 删除 API
6. `app/routes/analytics.tsx` - 统计分析页面

### 需要修改的文件
1. `wrangler.toml` - 启用 D1 和 R2
2. `app/lib/db/schema.sql` - 更新数据库结构
3. `app/routes/_index.tsx` - 移除 localStorage
4. `app/routes/bills.tsx` - 使用 API 而非 localStorage
5. `app/routes.ts` - 添加新路由

### 可以删除的文件
1. `app/lib/client/storage.ts` - 不再需要 localStorage 管理

---

## 技术要点

### 1. R2 文件上传
```typescript
const key = `raw-files/${uploadId}/${filename}`;
await bucket.put(key, file.stream());
```

### 2. Beancount 文件生成
- 现有逻辑在 `app/lib/pipeline/conversion-pipeline.ts`
- 需要返回 bean 内容字符串

### 3. 数据聚合
```typescript
// 从多个 bean 文件/解析数据中汇总
const allBills = uploads.flatMap(u => JSON.parse(u.parsed_data));

// 按分类统计
const byCategory = allBills.reduce((acc, bill) => {
  acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
  return acc;
}, {});
```

### 4. Recharts 集成
- 支持的图表：Treemap, BarChart, LineChart, PieChart
- 数据格式：`[{ name: '外卖', value: 1500 }, ...]`

---

## 预计工作量

| 步骤 | 时间 |
|------|------|
| 配置 Cloudflare 资源 | 30 分钟 |
| 数据库和存储服务层 | 2 小时 |
| API 实现（上传/列表/删除） | 2 小时 |
| 修改现有页面 | 1.5 小时 |
| 统计分析页面 | 2 小时 |
| 测试和调试 | 1 小时 |
| **总计** | **~9 小时** |

---

## 风险和注意事项

1. **D1 配置复杂** - 需要手动创建数据库和获取 ID
2. **R2 文件大小限制** - 单个文件最大 100MB（应该够用）
3. **数据一致性** - 确保 D1 和 R2 的事务性
4. **性能** - 大量文件时的查询性能（需要索引和分页）
5. **迁移成本** - localStorage 数据需要手动导出

---

## 后续优化

1. **用户认证** - 添加简单的密码保护
2. **批量上传** - 支持一次上传多个文件
3. **增量更新** - 检测重复文件，避免重复上传
4. **数据导出** - 导出所有数据为 JSON
5. **缓存** - 使用 Cloudflare KV 缓存统计数据

### 1. 项目定位的重大变更（高优先级）

**当前问题**：PLAN.md 仍然描述为"智能账单分析平台"，但实际已经转向"Beancount 文件生成器"

**需要添加**：
```markdown
## 项目定位

**核心功能**：将支付宝/微信/银行卡账单转换为 Beancount 格式
**目标用户**：使用 Beancount 生态系统的财务管理者
**工作流程**：
1. 用户上传账单文件
2. 自动解析并智能分类
3. 转换为 Beancount 格式
4. 使用 Fava 查看和分析

**为什么选择 Beancount**：
- 专业复式记账系统
- 自动平衡检查
- 成熟的生态系统（Fava、Beancount CLI）
- 强大的查询和报表功能
```

### 2. Beancount 集成方案（高优先级）

**需要添加**：
```markdown
## Beancount 集成

### 格式说明
- 账户命名规则：`Expenses:Food:Delivery`、`Assets:Bank:Alipay` 等
- 交易格式：标准 Beancount 语法
- 元数据支持：包含来源文件、交易时间等信息

### Fava 使用指南
1. 安装 Fava：`pip install fava`
2. 启动服务：`fava your-file.bean`
3. 访问 http://localhost:5000
4. 功能：
   - 查看账户余额
   - 分类统计图表
   - 时间趋势分析
   - 高级查询
   - 报表导出
```

### 3. AI 智能分类系统（高优先级）

**需要添加**：
```markdown
## AI 智能分类系统

### 三层分类策略
1. **原始分类**：优先使用账单自带的分类
2. **规则匹配**：13 条核心规则，关键词匹配
3. **AI Fallback**：批量调用 AI API，从 15 个标准分类中选择

### 15 个标准分类
- 餐饮：外卖、餐厅、生鲜
- 交通：打车、公共交通
- 购物：网购、日用品
- 医疗：医疗、保健
- 居住：水电燃气、网络通讯
- 教育：教育
- 其他：服务费用、公益捐赠
- 收入：工资、退款

### 关键文件
- `app/lib/beancount/category-taxonomy.ts` - 分类定义
- `app/lib/beancount/default-accounts.ts` - 规则配置
- `app/lib/client/parsers.ts` - 分类逻辑
```

### 4. 任务8 详细测试规划（中优先级）

**需要替换**：第292-296行的简单描述

**添加详细内容**：
```markdown
- [ ] **8. 本地测试完整流程**
  - **测试环境**：pnpm dev 本地开发服务器
  - **测试数据**：使用 ~/Downloads 中的真实账单文件

  **测试步骤**：
  1. 文件上传测试
     - 支付宝 CSV
     - 微信 CSV
     - Excel 文件
     - 验证自动识别

  2. 预览调整测试
     - 检查分类准确性
     - 测试删除功能
     - 测试选择功能

  3. 转换测试
     - 下载 .bean 文件
     - 验证格式正确性

  4. 账单历史测试
     - 自动保存验证
     - 搜索、排序、下载、删除

  5. Fava 集成测试
     - 启动 Fava：`fava downloaded-file.bean`
     - 验证文件可正确打开
     - 检查账户、交易、分类

  6. Bug 记录和修复

  **状态**: ⏳ 待开始
  **预计时间**: 1-2 小时
```

### 5. 本地存储机制（低优先级）

**需要添加**：
```markdown
## 本地存储系统

**实现**：`app/lib/client/storage.ts`
**存储方式**：localStorage
**容量限制**：最多 30 条记录
**数据结构**：SavedBill 接口（id, name, date, bills, beancountContent, transactionCount, totalAmount）
```

### 6. 路由配置变更（低优先级）

**需要添加**：
```markdown
## 路由系统

**配置文件**：`app/routes.ts`（显式配置，非自动发现）
**当前路由**：
- `/` - 首页（三步骤转换流程）
- `/bills` - 账单历史列表
- `/convert/beancount` - 转换工具页面

**注意**：新增路由需要在 `app/routes.ts` 中手动添加
```

---

## 实施步骤

1. ✅ 读取当前 PLAN.md
2. ⏳ 在"项目需求"后添加"项目定位"章节
3. ⏳ 在"技术栈"后添加"Beancount 集成"章节
4. ⏳ 在"核心功能"部分添加"AI 智能分类系统"说明
5. ⏳ 替换任务8的描述为详细测试规划
6. ⏳ 添加"本地存储系统"章节
7. ⏳ 添加"路由系统"章节
8. ⏳ 更新"下一步行动"和"进度追踪"
9. ⏳ 提交更新

---

## 关键文件

- `/Users/hefei/Developer/mana/PLAN.md` - 需要更新的文档
- `/Users/hefei/Developer/mana/CLAUDE.md` - 分类体系详细说明（已存在）
- `/Users/hefei/Developer/mana/app/lib/client/storage.ts` - 存储实现
- `/Users/hefei/Developer/mana/app/routes.ts` - 路由配置
