---
sidebar_position: 2
# id: what-is-evidence
title: Evidence Docs
hide_title: false
hide_table_of_contents: false
# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md
# description: How do I find you when I cannot solve this problem
# keywords:
#   - docs
# image: https://i.imgur.com/mErPwqL.png
---

# How it Works
<div style={{textAlign: 'center'}}>

![evidence-diagram](/img/how-it-works.png)

</div>

Evidence is based on [Svelte](https://svelte.dev) and [SvelteKit](https://kit.svelte.dev).

When you create a new Evidence project, we scaffold together a SvelteKit project with 3 additional features:

** 1. The Evidence Pre-Processor**, which handles processing markdown documents and SQL queries

** 2. The Evidence Data Warehouse Client**, which manages the database connection and the development cache

** 3. The Evidence Component Library**, which includes charts, tables, UI components, etc. 