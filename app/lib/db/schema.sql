-- 上传统计表
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'alipay', 'wechat', 'csv', 'excel'
  upload_date TEXT NOT NULL,

  -- R2 文件路径
  raw_file_key TEXT NOT NULL,
  bean_file_key TEXT NOT NULL,

  -- 统计信息
  transaction_count INTEGER NOT NULL,
  total_amount REAL NOT NULL,

  -- 原始解析数据（JSON 数组）
  parsed_data TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  -- JSON 格式存储设置
  custom_rules TEXT NOT NULL DEFAULT '[]',  -- JSON array
  budgets TEXT NOT NULL DEFAULT '[]',        -- JSON array
  ai_enabled INTEGER NOT NULL DEFAULT 1,     -- 0 or 1
  default_category TEXT NOT NULL DEFAULT 'Shopping-Daily',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_uploads_date ON uploads(upload_date);
CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(file_type);
