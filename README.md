# 拾光笔记

一个适合 GitHub Pages 的轻量个人博客，文章使用 Markdown 保存，支持分类、搜索、归档和独立阅读页。

## 本地运行

```bash
npm run build
npm run dev
```

打开 http://localhost:4173 。新增文章可以打开 `/write.html`，下载 Markdown 文件后放进 `posts/`，再运行 `npm run build`。

如果已经发布到 GitHub，也可以直接在仓库网页打开 `posts/`，点击 **Add file → Upload files** 上传文章文件并提交。稍等 GitHub Actions 完成，博客就会显示新文章。分类由文章顶部的 `category` 字段决定。

## 发布到 `xxx.github.io`

1. 在 GitHub 新建名为 `你的用户名.github.io` 的公开仓库。
2. 把本项目文件上传到仓库根目录。
3. 在仓库的 **Settings → Pages** 中选择 **GitHub Actions**。
4. 之后每次推送，Actions 会重新生成 `generated/posts.json` 并发布。

博客地址是 `https://你的用户名.github.io/`。如果仓库使用别的名字，地址通常会多一个仓库名路径，本项目也支持这种相对路径部署。
