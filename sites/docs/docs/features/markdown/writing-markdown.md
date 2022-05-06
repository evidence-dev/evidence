---
title: Writing Markdown
sidebar_position: 1
---

Evidence pages are just markdown pages. Anything you can do in a markdown page, you can do in an Evidence page. 

## Markdown Features
Evidence supports standard Markdown syntax. For tips, check out [Markdown Guide.](https://www.markdownguide.org/cheat-sheet/)

## Pages
Your project comes with a `pages` directory, which you can fill with markdown files. When you run your project, Evidence builds a webpage for each of those markdown files.

Each markdown page in your project corresponds to a URL. For example:  
`pages/marketing.md` = `localhost:3000/marketing`

Add folders inside the pages directory to create sections in your project. For example:  
`pages/departments/marketing.md` = `localhost:3000/departments/marketing`

## Instant Preview
The Evidence development server is extraordinarily fast. When you edit text on a markdown page and save it, your webpage will update almost instantly.