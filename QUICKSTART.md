# 快速启动指南

## 📦 项目已初始化完成！

### 🎯 技术栈
- **前端**: React Router v7 (原 Remix) + React 19
- **部署**: Cloudflare Pages + Workers
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **样式**: Tailwind CSS v4

### 📁 项目结构
```
mana/
├── app/
│   ├── routes/              # 页面路由
│   │   ├── _index.tsx       # 首页
│   │   └── bills.new.tsx    # 上传账单页面
│   ├── components/          # React 组件（待添加）
│   ├── lib/
│   │   ├── db.ts            # 数据库操作
│   │   ├── db/schema.sql    # 数据库表结构
│   │   ├── parsers/         # 账单解析器
│   │   │   ├── csv.ts       # 通用 CSV 解析
│   │   │   ├── alipay.ts    # 支付宝解析
│   │   │   └── wechat.ts    # 微信解析
│   │   └── analyzers/       # 分析器
│   │       ├── categorizer.ts  # 智能分类
│   │       └── anomaly.ts      # 异常检测
│   ├── root.tsx             # 根组件
│   └── styles.css           # 全局样式
├── wrangler.toml            # Cloudflare 配置
└── package.json
```

### 🚀 下一步操作

#### 1. 本地开发
```bash
npm run dev
```
访问 http://localhost:3000

#### 2. 初始化 Cloudflare D1 数据库
```bash
# 创建数据库
wrangler d1 create mana-db

# 复制返回的 database_id 到 wrangler.toml

# 本地初始化数据库
wrangler d1 execute mana-db --local --file=app/lib/db/schema.sql

# 生产环境初始化数据库
wrangler d1 execute mana-db --file=app/lib/db/schema.sql
```

#### 3. 创建 R2 存储桶（可选）
```bash
wrangler r2 bucket create mana-uploads
```

#### 4. 部署到 Cloudflare
```bash
# 登录 Cloudflare
npx wrangler login

# 部署
npm run deploy
```

### 📝 待开发功能

当前已完成基础架构，还需要实现：

1. **账单上传处理**
   - 在 `routes/bills.new.tsx` 添加 action 函数
   - 处理文件上传和解析
   - 保存到数据库

2. **账单列表页面**
   - 创建 `routes/bills.list.tsx`
   - 显示所有账单记录
   - 支持筛选和搜索

3. **统计分析页面**
   - 创建 `routes/analytics.tsx`
   - 显示分类统计图表
   - 趋势分析

4. **设置页面**
   - 创建 `routes/settings.tsx`
   - 管理分类规则
   - 设置预算限制

5. **组件开发**
   - BillUpload 组件
   - CategoryChart 图表组件
   - AnomalyAlert 告警组件

### 💡 开发提示

- **类型安全**: 项目使用 TypeScript，严格模式开启
- **样式**: 使用 Tailwind CSS 工具类
- **数据库**: 使用 D1 客户端（见 `app/lib/db.ts`）
- **解析器**: 在 `app/lib/parsers/` 中添加新的账单格式支持
- **分析器**: 在 `app/lib/analyzers/` 中扩展分析功能

### 🐛 调试

```bash
# 查看 Cloudflare 日志
wrangler pages dev --compatibility-date=2023-12-01 --proxy=3000 -- ./public

# 查询 D1 数据库
wrangler d1 execute mana-db --local --command="SELECT * FROM bills LIMIT 10"
```

### 📚 参考文档

- [React Router v7 文档](https://reactrouter.com)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1)
- [Tailwind CSS 文档](https://tailwindcss.com)
