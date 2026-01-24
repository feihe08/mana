# Mana - Claude Context

**项目**: Mana - 智能账单分析平台
**技术栈**: React Router v7 + Cloudflare
**最后更新**: 2025-01-16
**当前状态**: 核心功能已完成，待补充列表和分析页面

---

## 🚨 重要约束 - 必须遵守

**禁止行为**：
- ❌ 在未理解问题前修改任何代码
- ❌ 在用户未明确指示时执行 git commit
- ❌ 在未确认原因前更改配置文件
- ❌ 同时执行多个操作
- ❌ 跳过验证步骤（如构建后不检查、部署后不验证）
- ❌ 标记任务完成但实际未完成

**必须遵守的流程**：
1. 遇到问题时，先只做**只读操作**（Read, ls, git log, git diff, git status）
2. 分析并说明问题原因，提出解决方案
3. **等待用户确认**后再执行修改
   - 用户输入 `1` 表示同意，可以继续执行
4. 每次只做一个操作，不要批量修改

**部署验证承诺**：
1. **严格执行命令序列**：说"构建并部署"就必须两个命令都执行
   - `pnpm build` 构建
   - `npx wrangler deploy` 部署
   - 两个命令都执行完成才算完成
2. **验证每个关键步骤**：
   - 构建后：检查构建输出确认成功
   - 部署后：验证 HTTP 状态码（无 404 错误）
   - 代码提交后：运行 `git log` 确认提交成功
3. **诚实汇报状态**：
   - 如果遗漏步骤，立即承认
   - 不掩盖错误或问题
   - 每个关键操作后显示验证结果
4. **Todo 工具使用**：
   - 标记完成前确认实际完成
   - 复杂任务拆分为独立的可验证步骤
   - 每个步骤完成后立即验证再标记

**示例**：
```bash
# ✅ 正确流程
pnpm build && echo "✅ 构建完成"
npx wrangler deploy && echo "✅ 部署完成"
curl -s -o /dev/null -w "%{http_code}" https://mana.feihe.workers.dev/
# 输出: 200
echo "✅ 验证通过：无 404 错误"

# ❌ 错误流程（已发生过）
pnpm build
# 直接标记 todo 完成，跳过部署和验证
```

---

---

## 📖 项目概述

Mana 是一个自动分析账单的 Web 应用，支持导入支付宝、微信、银行卡账单，自动分类统计并检测异常支出。

### 核心功能
- 支持多种账单格式（支付宝、微信、CSV、Excel .xlsx/.xls）
- 客户端智能解析和分类（基于关键词匹配）
- 异常检测（高额支出、预算超支）
- 服务端数据存储（Cloudflare D1）
- AI 智能列识别（部分实现，客户端完成）

### 技术约束
- 部署平台: Cloudflare Pages + Workers
- 数据库: Cloudflare D1 (SQLite)
- 存储: Cloudflare R2
- 必须支持本地开发

---

## 🛠 技术栈

### 前端框架
- **React Router v7** (原 Remix) - 全栈 React 框架
- **React 19** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS v4** - 样式框架

### 后端/部署
- **Cloudflare Workers** - Serverless 运行时
- **Cloudflare Pages** - 前端托管
- **Cloudflare D1** - SQLite 分布式数据库
- **Cloudflare R2** - 对象存储（账单文件）

### 开发工具
- **Vite** - 构建工具
- **Wrangler** - Cloudflare CLI
- **pnpm** - 包管理器
- **TypeScript** - 类型检查

### 依赖库
- **xlsx** - Excel 文件解析
- **papaparse** - CSV 解析

---

## 📁 项目结构

```
mana/
├── app/
│   ├── routes/              # 页面路由
│   │   ├── _index.tsx       # 首页（仪表盘）
│   │   └── bills.new.tsx    # 上传账单页面
│   ├── components/          # React 组件
│   ├── lib/
│   │   ├── db.ts            # 数据库操作
│   │   ├── db/
│   │   │   └── schema.sql   # 数据库表结构
│   │   ├── client/          # 客户端解析器
│   │   ├── api/             # API 客户端
│   │   ├── cache/           # 缓存管理
│   │   ├── parsers/         # 账单解析器
│   │   │   ├── csv.ts       # 通用 CSV 解析
│   │   │   ├── alipay.ts    # 支付宝账单解析
│   │   │   ├── wechat.ts    # 微信账单解析
│   │   │   ├── smart-parser.ts    # AI 智能解析
│   │   │   └── universal.ts       # 通用解析器
│   │   └── analyzers/       # 分析器
│   │       ├── categorizer.ts  # 智能分类
│   │       └── anomaly.ts      # 异常检测
│   ├── root.tsx             # 根组件
│   ├── entry.client.tsx     # 客户端入口
│   ├── entry.server.tsx     # 服务端入口
│   └── styles.css           # 全局样式
├── public/                  # 静态资源
├── wrangler.toml            # Cloudflare 配置
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
├── package.json
├── README.md                # 项目说明
├── QUICKSTART.md            # 快速开始
├── REVIEW.md                # 项目总结和 TODO
└── CLAUDE.md                # 本文件
```

---

## 🏷️ 分类体系

Mana 使用统一的 **15 个标准分类**，所有账单分类（规则分类 + AI 分类）都必须落在这个分类体系内。

### 分类定义文件

**位置**: `app/lib/beancount/category-taxonomy.ts`

这是分类体系的**单一数据源**，定义了：
- 15 个标准分类的类型和列表
- 分类显示名称映射（用于前端展示）
- 分类描述（用于 AI 提示词）
- Beancount 账户与标准分类的双向映射

### 15 个标准分类

#### 支出类（13个）

| 主分类 | 子分类 | 标准分类代码 | 说明 | 示例 |
|--------|--------|--------------|------|------|
| **餐饮** | 外卖 | `Food-Delivery` | 外卖配送 | 美团、饿了么、汉堡王外卖 |
| | 餐厅 | `Food-Restaurant` | 餐厅用餐 | 小笼包、牛肉面、罗妈砂锅 |
| | 生鲜食品 | `Food-Groceries` | 生鲜食品 | 菜鲜果美、超市、菜市场 |
| **交通** | 打车 | `Transport-Taxi` | 打车出行 | 滴滴、网约车、出租车 |
| | 公共交通 | `Transport-Public` | 公共交通 | 地铁、公交、一卡通 |
| **购物** | 网购 | `Shopping-Online` | 网购 | 京东、淘宝、拼多多 |
| | 日用品 | `Shopping-Daily` | 日用品 | 名创优品、便利店、百货 |
| **医疗健康** | 医疗 | `Health-Medical` | 医疗 | 医院、体检、药品、医保 |
| | 保健 | `Health-Wellness` | 保健 | 按摩、修脚、健身、美容 |
| **居住** | 水电燃气 | `Housing-Utilities` | 水电燃气 | 水费、电费、燃气、桶装水、充电 |
| | 网络通讯 | `Housing-Internet` | 网络通讯 | 宽带、话费、充值 |
| **教育** | 教育 | `Education-Learning` | 教育 | 培训、课程、书籍、学校 |
| **其他** | 服务费用 | `Misc-Fees` | 服务费用 | 手续费、代理费、服务费 |
| | 公益捐赠 | `Misc-Charity` | 公益捐赠 | 慈善捐款、公益组织 |

#### 收入类（2个）

| 主分类 | 标准分类代码 | 说明 | 示例 |
|--------|--------------|------|------|
| **收入** | `Income-Salary` | 工资收入 | 工资、奖金、薪资 |
| | `Income-Refunds` | 退款/转账 | 退款、转账收入 |

### 分类映射

#### 标准分类 → Beancount 账户
```
Food-Delivery → Expenses:Food:Delivery
Food-Restaurant → Expenses:Food:Restaurant
...
Shopping-Daily → Expenses:Shopping:Daily
Income-Salary → Income:Salary
```

#### 标准分类 → 显示名称
```
Food-Delivery → "外卖"
Food-Restaurant → "餐厅"
Shopping-Online → "网购"
```

### 分类维护规范

1. **添加新分类**
   - 在 `category-taxonomy.ts` 中添加新的 `StandardCategory` 类型
   - 更新 `STANDARD_CATEGORIES`、`CATEGORY_DISPLAY_NAMES`、`CATEGORY_DESCRIPTIONS`
   - 更新 `BEANCOUNT_TO_CATEGORY` 和 `CATEGORY_TO_BEANCOUNT` 映射
   - 同步更新 `default-accounts.ts` 中的分类规则
   - 同步更新 `workers/app.ts` 中的 AI 提示词

2. **修改分类规则**
   - 在 `default-accounts.ts` 中修改 `categoryRules`
   - 确保规则的 `account` 字段映射到标准分类

3. **AI 分类约束**
   - AI 提示词硬编码 15 个标准分类
   - AI 返回的分类必须是标准分类之一
   - `parsers.ts` 验证 AI 返回值，非标准分类自动映射到 `Shopping-Daily`（兜底）

### 分类策略

Mana 使用**三层分类策略**：

1. **第一层：原始分类**
   - 优先使用账单自带的分类（如支付宝的"餐饮美食"）
   - 映射到标准分类

2. **第二层：规则匹配**
   - 13 条核心规则，覆盖常见场景
   - 基于关键词正则匹配
   - 映射到标准分类

3. **第三层：AI Fallback**
   - 批量调用 AI API
   - AI 从 15 个标准分类中选择
   - 失败时使用 `Shopping-Daily` 兜底

### 代码示例

```typescript
import {
  beancountToCategory,
  getCategoryDisplayName,
  isValidCategory,
  STANDARD_CATEGORIES,
  type StandardCategory,
} from "../beancount/category-taxonomy";

// 验证分类
if (isValidCategory("Food-Delivery")) {
  const displayName = getCategoryDisplayName("Food-Delivery");
  console.log(displayName); // "外卖"
}

// Beancount 账户 → 标准分类
const category = beancountToCategory("Expenses:Food:Delivery");
console.log(category); // "Food-Delivery"

// 获取所有标准分类
console.log(STANDARD_CATEGORIES.length); // 15
```

---

## 🎯 核心概念

### React Router v7 特性
- **Loaders**: 服务端数据加载函数
- **Actions**: 表单提交和数据修改函数
- **Context**: 访问 Cloudflare 环境变量（DB、BUCKET）

### 数据流
```
用户上传文件
  → Remix Action 接收
  → 调用对应的 Parser 解析
  → 调用 Categorizer 智能分类
  → 调用 DB 操作保存到 D1
  → 调用 Anomaly Detector 检测异常
  → 重定向到结果页面
```

### 数据库设计
```sql
bills (账单表)
  - id, source, amount, category, description, transaction_date, original_data

categories (分类规则表)
  - id, name, keywords (JSON), budget_limit

anomalies (异常记录表)
  - id, bill_id, reason, detected_at
```

---

## 📝 开发规范

### 文件命名
- 路由文件: `app/routes/*.tsx`
- 组件文件: `app/components/*.tsx`
- 工具函数: `app/lib/*.ts`
- 类型定义: 与使用处同文件

### TypeScript 规范
- 严格模式开启
- 所有函数必须有类型注解
- 使用 Cloudflare Workers 类型: `@cloudflare/workers-types`

### 路由模式
```typescript
// 标准 Route 结构
import type { Route } from "./+types/file";

export function meta() {
  return [{ title: "页面标题" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.env.DB as D1Database;
  const data = await getBills(db);
  return data;
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  // 处理表单提交...
}

export default function Component() {
  // UI 组件...
}
```

### 解析器接口
```typescript
export interface ParsedBill {
  id: string;
  amount: number;
  description: string;
  transactionDate: string;
  originalData: Record<string, any>;
}

// 所有解析器必须实现此接口
export async function parseXXX(file: File): Promise<ParsedBill[]>
```

### 数据库操作
- 使用 `app/lib/db.ts` 中的函数
- 所有查询必须参数化（防 SQL 注入）
- 错误必须被捕获并处理

---

## ⚠️ 当前开发重点

### 高优先级任务
1. **账单列表页面** - 创建 `bills.list.tsx` 展示已上传账单
2. **统计分析页面** - 创建 `analytics.tsx` 实现数据可视化
3. **设置页面** - 创建 `settings.tsx` 管理分类规则和预算

### 中优先级任务
4. **AI 智能列识别（服务端）** - 实现服务端 API 端点
5. **错误处理完善** - 增强解析器和文件上传的错误处理
6. **用户体验优化** - 添加加载动画、错误提示等

详细任务列表见: `REVIEW.md`

---

## ✅ 待办任务（按优先级）

### 立即开始
1. **实现账单列表页面** (1.5小时) - 展示已上传账单，支持筛选和搜索
2. **实现统计分析页面** (2小时) - 数据可视化，分类统计

### 功能完善
3. **实现设置页面** (1.5小时) - 管理分类规则和预算
4. **添加错误处理和文件验证** (1小时) - 增强用户体验
5. **本地测试完整流程** (1小时) - 端到端测试

### 后续优化
6. AI 智能列识别（服务端部分）
7. 添加图表可视化库
8. 安全加固
9. 性能优化

完整 TODO 见: `REVIEW.md#任务清单`

---

## 🔑 重要约定

### Cloudflare 环境变量
```typescript
// 在 wrangler.toml 中定义
// 在路由中通过 context.env 访问
context.env.DB  // D1Database 实例
context.env.BUCKET  // R2Bucket 实例
```

### 本地开发
```bash
pnpm dev  # 启动开发服务器（需要先配置 wrangler）
```

### 类型定义位置
- Cloudflare Workers 类型: `@cloudflare/workers-types`
- Route 类型: React Router 自动生成在 `app/routes/+types/*.ts`

### 不做的事
- 不要使用 Next.js（用户明确拒绝）
- 不要添加不必要的依赖
- 不要过度抽象（保持简单）
- 不要添加 npm scripts 中未定义的命令

---

## 💡 决策记录

### 为什么选择 React Router v7 (Remix)?
- 用户熟悉 Vite + React，想学习 Remix
- 服务器端处理账单文件更高效
- 表单处理（文件上传）更优雅
- Cloudflare 集成更成熟

### 为什么使用 Cloudflare D1 而非其他数据库?
- 用户计划部署到 Cloudflare
- D1 免费额度慷慨
- SQLite 兼容，易于本地开发

### 为什么选择 Tailwind CSS v4?
- 快速开发
- 与 Vite 集成好
- 用户熟悉（从 Vite + React 背景来）

---

## 📚 参考文档

### 官方文档
- [React Router v7](https://reactrouter.com)
- [Cloudflare Pages](https://developers.cloudflare.com/pages)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)
- [Tailwind CSS v4](https://tailwindcss.com)

### 项目文档
- `README.md` - 项目说明和快速开始
- `QUICKSTART.md` - 详细开发指南
- `REVIEW.md` - 项目总结、问题分析和 TODO 清单

---

## 🎯 开发优先级

### 遵循以下原则
1. **先核心，后优化** - 列表展示、数据分析是核心
2. **先简单，后完善** - 基础功能实现后再添加错误处理
3. **先本地，后部署** - 本地测试通过后再考虑部署

---

## 🤖 与 Claude 协作建议

### 什么情况下需要更新此文件
- 技术栈发生变化
- 项目架构重大调整
- 新增重要约定
- 解决关键阻塞问题

### 代码审查重点
- TypeScript 类型安全
- 错误处理是否充分
- Cloudflare 集成是否正确
- 是否遵循现有架构

### 测试建议
- 每个功能实现后立即测试
- 使用真实的支付宝/微信账单文件测试解析器
- 本地测试通过后再考虑部署

---

**最后更新**: 2025-01-16
**维护者**: Hefei
**项目状态**: 🟢 核心功能已完成 - 待补充列表和分析页面
