---
sidebar_position: 1
title: Pages
description: Evidence renders markdown files into web pages. 
---

Evidence renders markdown files into web pages. Markdown files are stored in the `/pages` directory.

When developing, pages are rendered at `localhost:3000`. Evidence will instantly reload pages when you edit and save their markdown files.

Evidence is a static site generator, meaning that when you run `npm run build` it builds static HTML pages from those markdown files. If you [deploy your project](../../deployment/), this is how the site your users see is generated.

## Basic Navigation

Evidence uses a **file based routing system**, meaning that the URL where user can access the page is determined by the path to the markdown file in the `/pages` directory:

- `pages/index.md` is the homepage
- `pages/weekly-sales.md` creates the `/weekly-sales` page
- `pages/marketing/attribution.md` creates the `/marketing/attribution` page
- `pages/customers/[customer].md` creates a page for each customer using the `[customer].md` template. See [templated pages](../templated-pages) for details.

This allows you to organize your pages in a way that makes sense for your users, for example:

- by department
- by product
- by customer
- by time period