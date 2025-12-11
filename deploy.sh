#!/bin/bash

# GitHub Pages 快速部署脚本
# 使用方法：./deploy.sh YOUR_GITHUB_USERNAME REPO_NAME

echo "🚀 开始部署聊天记录生成器到 GitHub Pages..."
echo ""

# 检查参数
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ 错误：请提供 GitHub 用户名和仓库名称"
    echo ""
    echo "使用方法："
    echo "  ./deploy.sh YOUR_USERNAME REPO_NAME"
    echo ""
    echo "示例："
    echo "  ./deploy.sh johndoe chat-generator"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME=$2
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo "📋 配置信息："
echo "  GitHub 用户名: ${GITHUB_USERNAME}"
echo "  仓库名称: ${REPO_NAME}"
echo "  仓库地址: ${REPO_URL}"
echo ""

# 检查是否已初始化 Git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git branch -M main
fi

# 检查是否已添加远程仓库
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ 远程仓库已配置"
    git remote set-url origin ${REPO_URL}
else
    echo "🔗 添加远程仓库..."
    git remote add origin ${REPO_URL}
fi

# 添加所有文件
echo "📝 添加文件..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Deploy chat generator to GitHub Pages" || echo "⚠️  没有新更改需要提交"

# 推送到 GitHub
echo "⬆️  推送到 GitHub..."
git push -u origin main

echo ""
echo "✅ 代码已推送到 GitHub！"
echo ""
echo "📌 下一步："
echo "1. 访问 https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings/pages"
echo "2. 在 'Source' 部分选择 'Deploy from a branch'"
echo "3. Branch 选择 'main'，Folder 选择 '/ (root)'"
echo "4. 点击 'Save'"
echo "5. 等待几分钟后，访问：https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
echo ""
echo "🔐 密码保护："
echo "  访问密码: hifi123@"
echo "  如需修改，请编辑 index.html 中的 ACCESS_PASSWORD 变量"
echo ""

