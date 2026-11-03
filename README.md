# 宇宙回声

一个适合 GitHub Pages 的轻量个人博客，文章使用 Markdown 保存，支持两级分类、关键词标签、搜索、归档和独立阅读页。

## 本地运行

```bash
npm run build
npm run dev
```

打开 http://localhost:4173 。新增文章可以打开 `/write.html`，下载 Markdown 文件后放进与分类对应的 `posts/` 子文件夹，再运行 `npm run build`。

## 写文章和分类

打开 `/write.html`，填写一级分类（例如“学习”）、二级分类（例如“NLP”）和关键词标签，再下载 Markdown 文件。也可以自己新建 `posts/学习/NLP/2026-10-21-transformer.md`：

```md
---
title: Transformer 阅读笔记
date: 2026-10-21
category: 学习/NLP
summary: 记录注意力机制的核心思路。
tags: Transformer, 注意力机制, 论文阅读
---

# Transformer 阅读笔记

这里写正文。
```

`category` 写成 `一级分类/二级分类`；二级分类可省略，例如 `category: 随笔`。归档页会先显示一级分类，选中后显示对应的二级分类。`tags` 是多个自由关键词，用英文逗号隔开，也能被搜索。

文章按分类放在 `posts/一级分类/` 下；有二级分类时可再建一层，如 `posts/学习/NLP/`。当前文章位于 `posts/学习/` 和 `posts/随笔/`。构建脚本会读取 `posts/` 下各层的 Markdown 文件，移动文件不会改变博客文章链接。

## 上传 Markdown

如果已发布到 GitHub，打开 [Hamster-zc.github.io 仓库的 posts 文件夹](https://github.com/Hamster-zc/Hamster-zc.github.io/tree/main/posts)，进入对应的分类文件夹（如 `学习` 或 `随笔`），点击 **Add file → Upload files**，选择下载的 `.md` 文件，点击 **Commit changes**。新分类可先用 **Add file → Create new file** 在相应路径下创建文章。稍等 [Actions](https://github.com/Hamster-zc/Hamster-zc.github.io/actions) 部署完成，博客就会显示新文章。

如果从本地上传，把文件放入 `C:\ZC\Blog\posts\<一级分类>`（有二级分类时继续建子文件夹），然后运行：

```bash
npm run build
git add posts generated/posts.json
git commit -m "Add a post"
git push
```

## 发布到 `xxx.github.io`

1. 在 GitHub 新建名为 `你的用户名.github.io` 的公开仓库。
2. 把本项目文件上传到仓库根目录。
3. 在仓库的 **Settings → Pages** 中选择 **GitHub Actions**。
4. 之后每次推送，Actions 会重新生成 `generated/posts.json` 并发布。

博客地址是 `https://你的用户名.github.io/`。如果仓库使用别的名字，地址通常会多一个仓库名路径，本项目也支持这种相对路径部署。
