-- 账单表
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL, -- 'alipay', 'wechat', 'bank', 'csv'
  amount REAL NOT NULL,
  category TEXT, -- 消费类别（自动分类）
  description TEXT,
  transaction_date TEXT NOT NULL,
  original_data TEXT, -- 原始数据（JSON 格式存储）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 分类规则表
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  keywords TEXT, -- JSON 数组，匹配关键词
  budget_limit REAL, -- 预算限制
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 异常记录表
CREATE TABLE IF NOT EXISTS anomalies (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL,
  reason TEXT NOT NULL, -- 异常原因
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- 统计视图
CREATE VIEW IF NOT EXISTS bill_stats AS
SELECT
  category,
  COUNT(*) as count,
  SUM(amount) as total,
  AVG(amount) as average,
  MIN(transaction_date) as first_date,
  MAX(transaction_date) as last_date
FROM bills
GROUP BY category;

-- 默认分类数据
INSERT OR IGNORE INTO categories (id, name, keywords, budget_limit) VALUES
  ('cat-food', '餐饮', '["餐饮", "美食", "外卖", "饭", "面", "菜"]', 2000),
  ('cat-transport', '交通', '["交通", "打车", "地铁", "公交", "加油", "停车"]', 1000),
  ('cat-shopping', '购物', '["购物", "淘宝", "京东", "超市", "便利店"]', 3000),
  ('cat-entertainment', '娱乐', '["娱乐", "电影", "游戏", "KTV", "健身"]', 1000),
  ('cat-housing', '居住', '["房租", "水电", "燃气", "物业", "宽带"]', 5000),
  ('cat-uncategorized', '未分类', '[]', 0);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_source ON bills(source);
CREATE INDEX IF NOT EXISTS idx_anomalies_bill_id ON anomalies(bill_id);
