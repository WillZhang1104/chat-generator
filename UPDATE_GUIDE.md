# 更新指南：本地和 GitHub 同步更新

## 工作流程

每次修改代码后，需要同时更新本地和 GitHub：

### 步骤 1：修改代码
在本地编辑器中修改文件（如 `index.html`、`conversation-generator.js` 等）

### 步骤 2：提交到本地 Git
```bash
cd "/Users/jiamingzhang/Documents/AI学习/Geoswift/聊天对话/聊天记录生成器"

# 查看更改
git status

# 添加所有更改的文件
git add .

# 提交更改（请写清楚提交信息）
git commit -m "描述你的更改内容"
```

### 步骤 3：推送到 GitHub
```bash
git push
```

### 步骤 4：等待 GitHub Pages 自动更新
- GitHub Pages 会自动检测到新的推送
- 通常在 1-3 分钟内自动部署更新
- 可以在 Actions 页面查看部署状态：https://github.com/WillZhang1104/chat-generator/actions

## 快速更新脚本

你也可以创建一个快速更新脚本：

```bash
#!/bin/bash
cd "/Users/jiamingzhang/Documents/AI学习/Geoswift/聊天对话/聊天记录生成器"
git add .
git commit -m "$1"
git push
echo "✅ 已推送到 GitHub，等待自动部署..."
```

使用方法：
```bash
./quick-update.sh "更新密码保护功能"
```

## 常用 Git 命令

### 查看状态
```bash
git status
```

### 查看更改内容
```bash
git diff
```

### 查看提交历史
```bash
git log --oneline
```

### 撤销未提交的更改
```bash
# 撤销某个文件的更改
git checkout -- 文件名

# 撤销所有未提交的更改
git checkout -- .
```

### 查看远程仓库
```bash
git remote -v
```

## 注意事项

1. **提交信息要清晰**：每次提交时写清楚做了什么更改
2. **定期推送**：不要积累太多更改再推送，建议每次修改后立即推送
3. **检查部署状态**：推送后检查 GitHub Actions 确保部署成功
4. **测试网站**：部署完成后访问网站测试功能是否正常

## 验证更新

更新后，访问网站验证：
```
https://willzhang1104.github.io/chat-generator/
```

如果看到最新的更改，说明更新成功！

