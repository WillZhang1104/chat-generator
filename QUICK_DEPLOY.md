# 快速部署指南

## 密码已更新为：hifi123@

## 下一步操作

### 1. 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `chat-generator`（或你喜欢的名称）
   - **Description**: `聊天记录生成器`
   - **Visibility**: Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
3. 点击 "Create repository"

### 2. 推送代码到 GitHub

在终端执行以下命令（将 YOUR_USERNAME 替换为你的 GitHub 用户名）：

```bash
cd "/Users/jiamingzhang/Documents/AI学习/Geoswift/聊天对话/聊天记录生成器"

# 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/chat-generator.git

# 推送到 GitHub
git push -u origin main
```

如果提示需要认证，请使用 GitHub Personal Access Token（不是密码）。

### 3. 启用 GitHub Pages

1. 访问：https://github.com/YOUR_USERNAME/chat-generator/settings/pages
2. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`
3. 点击 "Save"
4. 等待几分钟后访问：https://YOUR_USERNAME.github.io/chat-generator/

## 访问密码

默认密码：`hifi123@`

