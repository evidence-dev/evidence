---
sidebar_position: 1
title: Pages
description: Evidence renders markdown files into web pages.
---

Evidence renders markdown files into web pages. When developing, the markdown file `/pages/example.md` is rendered at [localhost:3000/example](localhost:3000/example).

Evidence instantly reloads pages when their markdown files are edited and saved.

## File Based Routing

The URL to access a page is determined by the path to the markdown file in the `/pages` directory:

- `pages/index.md` is the homepage
- `pages/weekly-sales.md` creates the `/weekly-sales` page
- `pages/marketing/attribution.md` creates the `/marketing/attribution` page

This allows you to organize your pages in a way that makes sense for your users, for example:

- by department
- by product
- by customer
- by time period

## Templated Pages

- `pages/customers/[customer].md` creates a page for each customer using the `[customer].md` template. See [templated pages](../templated-pages) for details.

## Frontmatter

You can include page metadata, such as a title, using [frontmatter](/markdown#frontmatter).
