#!/bin/bash

# 快速更新脚本：提交并推送到 GitHub

if [ -z "$1" ]; then
    echo "❌ 错误：请提供提交信息"
    echo ""
    echo "使用方法："
    echo "  ./quick-update.sh \"你的提交信息\""
    echo ""
    echo "示例："
    echo "  ./quick-update.sh \"更新密码保护功能\""
    exit 1
fi

cd "$(dirname "$0")"

echo "📝 检查更改..."
git status --short

echo ""
echo "📦 添加所有更改..."
git add .

echo ""
echo "💾 提交更改..."
git commit -m "$1"

if [ $? -eq 0 ]; then
    echo ""
    echo "⬆️  推送到 GitHub..."
    git push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 已成功推送到 GitHub！"
        echo ""
        echo "📌 GitHub Pages 将在 1-3 分钟内自动更新"
        echo "   查看部署状态: https://github.com/WillZhang1104/chat-generator/actions"
        echo "   访问网站: https://willzhang1104.github.io/chat-generator/"
    else
        echo ""
        echo "❌ 推送失败，请检查网络连接或认证信息"
    fi
else
    echo ""
    echo "⚠️  没有更改需要提交"
fi


