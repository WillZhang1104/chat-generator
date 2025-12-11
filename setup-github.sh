#!/bin/bash

# 交互式 GitHub 部署脚本

echo "🚀 聊天记录生成器 - GitHub 部署助手"
echo "======================================"
echo ""

# 检查 Git 配置
GIT_USERNAME=$(git config user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")

if [ -n "$GIT_USERNAME" ]; then
    echo "检测到 Git 用户名: $GIT_USERNAME"
    read -p "这是你的 GitHub 用户名吗？(y/n，默认: y): " confirm
    if [ "$confirm" != "n" ] && [ "$confirm" != "N" ]; then
        GITHUB_USERNAME="$GIT_USERNAME"
    else
        read -p "请输入你的 GitHub 用户名: " GITHUB_USERNAME
    fi
else
    read -p "请输入你的 GitHub 用户名: " GITHUB_USERNAME
fi

echo ""
read -p "请输入 GitHub 仓库名称（默认: chat-generator）: " REPO_NAME
REPO_NAME=${REPO_NAME:-chat-generator}

echo ""
echo "📋 配置信息："
echo "  GitHub 用户名: $GITHUB_USERNAME"
echo "  仓库名称: $REPO_NAME"
echo "  仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

read -p "确认创建并推送代码？(y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ 已取消"
    exit 1
fi

echo ""
echo "📦 检查 Git 状态..."
cd "$(dirname "$0")"

# 检查远程仓库
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ 远程仓库已存在，更新地址..."
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
else
    echo "🔗 添加远程仓库..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# 确保所有更改已提交
echo "📝 检查未提交的更改..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "发现未提交的更改，正在提交..."
    git add .
    git commit -m "Update: 密码保护和其他改进"
fi

# 推送到 GitHub
echo ""
echo "⬆️  推送到 GitHub..."
echo "⚠️  如果提示需要认证，请使用 GitHub Personal Access Token（不是密码）"
echo "   创建 Token: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 代码已成功推送到 GitHub！"
    echo ""
    echo "📌 下一步：启用 GitHub Pages"
    echo "1. 访问: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
    echo "2. 在 'Source' 部分："
    echo "   - 选择 'Deploy from a branch'"
    echo "   - Branch: main"
    echo "   - Folder: / (root)"
    echo "3. 点击 'Save'"
    echo "4. 等待几分钟后访问: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
    echo ""
    echo "🔐 访问密码: hifi123@"
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "1. GitHub 仓库尚未创建 - 请先访问 https://github.com/new 创建仓库"
    echo "2. 认证失败 - 需要使用 Personal Access Token"
    echo "3. 网络问题 - 请检查网络连接"
    echo ""
    echo "如果仓库尚未创建，请："
    echo "1. 访问 https://github.com/new"
    echo "2. 仓库名: $REPO_NAME"
    echo "3. 不要勾选 'Initialize this repository with a README'"
    echo "4. 创建后重新运行此脚本"
fi


