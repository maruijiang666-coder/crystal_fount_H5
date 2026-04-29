#!/bin/bash

# 水晶手串H5项目部署脚本
# 生产环境部署

set -e

echo "🚀 开始部署水晶手串H5项目..."

# 1. 检查环境
echo "📋 检查环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 2. 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down || true

# 3. 清理旧镜像（可选）
echo "🧹 清理旧镜像..."
docker image prune -f

# 4. 构建新镜像
echo "🔨 构建新镜像..."
docker-compose build --no-cache

# 5. 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 6. 检查服务状态
echo "🔍 检查服务状态..."
sleep 5
docker-compose ps

# 7. 验证部署
echo "✅ 验证部署..."
curl -f http://localhost:8070 || echo "⚠️  服务可能还在启动中，请稍后再试"

echo "🎉 部署完成！"
echo "📍 应用地址: http://localhost:8070"
echo "📊 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"