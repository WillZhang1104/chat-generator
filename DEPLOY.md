# GitHub Pages 部署指南

本指南将帮助你将聊天记录生成器发布到 GitHub Pages，让其他人可以通过网页访问。

## 📋 前置要求

1. 拥有 GitHub 账号（如果没有，请访问 https://github.com 注册）
2. 已安装 Git（如果没有，请访问 https://git-scm.com/downloads 下载）

## 🚀 部署步骤

### 第一步：创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角的 `+` 号，选择 `New repository`
3. 填写仓库信息：
   - **Repository name**: `chat-generator`（或你喜欢的名称）
   - **Description**: `聊天记录生成器 - 生成 WhatsApp/Telegram/Email 对话记录`
   - **Visibility**: 选择 `Public`（公开）或 `Private`（私有）
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 `Create repository`

### 第二步：上传代码到 GitHub

在终端中执行以下命令（请将 `YOUR_USERNAME` 替换为你的 GitHub 用户名）：

```bash
# 进入项目目录
cd "/Users/jiamingzhang/Documents/AI学习/Geoswift/聊天对话/聊天记录生成器"

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交文件
git commit -m "Initial commit: 聊天记录生成器"

# 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/chat-generator.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 第三步：启用 GitHub Pages

1. 在 GitHub 仓库页面，点击 `Settings`（设置）
2. 在左侧菜单中找到 `Pages`（页面）
3. 在 `Source`（源）部分：
   - 选择 `Deploy from a branch`
   - Branch 选择 `main`
   - Folder 选择 `/ (root)`
4. 点击 `Save`（保存）
5. 等待几分钟，GitHub 会生成你的网站地址：
   - 格式：`https://YOUR_USERNAME.github.io/chat-generator/`

### 第四步：修改密码

1. 打开 `index.html` 文件
2. 找到这一行（大约在第 410 行）：
   ```javascript
   const ACCESS_PASSWORD = 'geoswift2024';
   ```
3. 将 `'geoswift2024'` 改为你想要的密码
4. 保存文件后，重新提交到 GitHub：
   ```bash
   git add index.html
   git commit -m "Update password"
   git push
   ```

## 🔐 密码保护说明

- 默认密码：`geoswift2024`
- 密码存储在浏览器会话中，关闭浏览器后需要重新输入
- 密码验证在客户端进行，适合基础保护
- 如需更强的安全性，建议使用 GitHub Private Repository + 访问令牌

## 📝 更新代码

当你需要更新工具时：

```bash
# 进入项目目录
cd "/Users/jiamingzhang/Documents/AI学习/Geoswift/聊天对话/聊天记录生成器"

# 修改文件后，提交更改
git add .
git commit -m "描述你的更改"
git push
```

GitHub Pages 会自动更新（通常需要几分钟）。

## 🌐 访问你的网站

部署完成后，访问地址格式为：
```
https://YOUR_USERNAME.github.io/chat-generator/
```

## ⚠️ 注意事项

1. **密码安全**：当前密码保护是客户端验证，技术用户可以通过查看源代码看到密码。如需更高安全性，考虑：
   - 使用 GitHub Private Repository
   - 使用第三方密码保护服务（如 Netlify Password Protection）
   - 部署到需要身份验证的平台

2. **文件大小**：GitHub Pages 对单个文件大小有限制（通常 100MB），当前项目文件很小，不会有问题。

3. **自定义域名**：如果需要使用自己的域名，可以在 GitHub Pages 设置中添加。

## 🆘 常见问题

**Q: 推送代码时提示需要认证？**
A: GitHub 已不再支持密码认证，需要：
- 使用 Personal Access Token（个人访问令牌）
- 或配置 SSH 密钥

**Q: 如何生成 Personal Access Token？**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token"
3. 选择权限：`repo`
4. 复制生成的 token，在推送时作为密码使用

**Q: 网站显示 404？**
A: 确保：
- GitHub Pages 已启用
- 文件已推送到 `main` 分支
- 等待几分钟让 GitHub 处理

**Q: 如何让仓库私有但网站公开？**
A: GitHub Pages 免费版不支持私有仓库的公开网站。可以：
- 使用 GitHub Pro（付费）
- 或使用其他平台（如 Netlify、Vercel）

## 📚 相关资源

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Git 入门指南](https://guides.github.com/introduction/git-handbook/)
- [GitHub Pages 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

