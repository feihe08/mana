#!/bin/bash

# Mana - Cloudflare Pages 部署脚本
# 用法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "======================================"
echo "  Mana - Cloudflare Pages 部署"
echo "======================================"
echo ""

# 检查 wrangler.toml 配置
if [ ! -f "wrangler.toml" ]; then
  echo "❌ 错误: 找不到 wrangler.toml 配置文件"
  exit 1
fi

# 显示配置信息
echo "📋 当前配置:"
echo "   项目名: $(grep '^name' wrangler.toml | head -1 | cut -d'=' -f2 | xargs)"
echo "   构建目录: $(grep 'pages_build_output_dir' wrangler.toml | cut -d'=' -f2 | xargs)"
echo ""

# 步骤 1: 构建项目
echo "🔨 步骤 1/2: 构建项目..."
pnpm build

if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi

echo "✅ 构建成功"
echo ""

# 步骤 2: 部署到 Cloudflare Pages
echo "🚀 步骤 2/2: 部署到 Cloudflare Pages..."
npx wrangler pages deploy

if [ $? -ne 0 ]; then
  echo "❌ 部署失败"
  exit 1
fi

echo ""
echo "======================================"
echo "✅ 部署完成！"
echo "======================================"
