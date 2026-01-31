-- 添加文件哈希字段用于去重
-- 迁移日期: 2026-01-31

-- 1. 添加 file_hash 字段
ALTER TABLE uploads ADD COLUMN file_hash TEXT;

-- 2. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_uploads_file_hash ON uploads(file_hash);
