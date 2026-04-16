#!/bin/bash

# 智搭后端服务启动脚本

echo "=========================================="
echo "  智搭后端服务启动脚本"
echo "=========================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt -q

# 检查环境变量
if [ ! -f ".env" ]; then
    echo ""
    echo "警告: 未找到.env文件"
    echo "请复制.env.example为.env并填入智谱AI的API密钥"
    echo "命令: cp .env.example .env"
    echo ""
    read -p "是否继续启动（无API密钥将无法使用AI功能）? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动服务
echo ""
echo "启动服务..."
python app.py
