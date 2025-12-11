#!/bin/bash

# 自动部署脚本 - 使用默认值

echo "🚀 自动部署聊天记录生成器到 GitHub Pages"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# 获取 Git 配置中的用户名
GIT_USERNAME=$(git config user.name 2>/dev/null || echo "")
GITHUB_USERNAME="${GIT_USERNAME:-Youzou-joy}"
REPO_NAME="chat-generator"

echo "📋 使用配置："
echo "  GitHub 用户名: $GITHUB_USERNAME"
echo "  仓库名称: $REPO_NAME"
echo "  仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# 检查远程仓库
if git remote get-url origin > /dev/null 2>&1; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "✅ 远程仓库已存在: $CURRENT_REMOTE"
    echo "更新远程仓库地址..."
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
    git commit -m "Update: 准备部署到 GitHub Pages"
fi

# 显示当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 推送到 GitHub
echo ""
echo "⬆️  推送到 GitHub..."
echo "⚠️  如果提示需要认证，请使用 GitHub Personal Access Token"
echo "   创建 Token: https://github.com/settings/tokens"
echo ""

git push -u origin main 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
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
    echo ""
    echo "✨ 部署完成！"
else
    echo ""
    echo "❌ 推送失败（退出码: $EXIT_CODE）"
    echo ""
    echo "可能的原因："
    echo "1. GitHub 仓库尚未创建"
    echo "   请先访问 https://github.com/new 创建仓库 '$REPO_NAME'"
    echo ""
    echo "2. 认证失败"
    echo "   GitHub 不再支持密码认证，需要使用 Personal Access Token"
    echo "   创建 Token: https://github.com/settings/tokens"
    echo "   选择权限: repo"
    echo "   推送时，用户名用 GitHub 用户名，密码用 Token"
    echo ""
    echo "3. 网络问题"
    echo "   请检查网络连接"
    echo ""
    echo "如果仓库尚未创建，请："
    echo "1. 访问 https://github.com/new"
    echo "2. 仓库名: $REPO_NAME"
    echo "3. 不要勾选 'Initialize this repository with a README'"
    echo "4. 创建后重新运行此脚本: ./auto-deploy.sh"
fi


