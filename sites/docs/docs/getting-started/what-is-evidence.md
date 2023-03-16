---
sidebar_position: 1
slug: /
title: What is Evidence?
hide_table_of_contents: true
hide_title: false
breadcrumbs: false
image: /img/how-it-works.png
---

Evidence is a code-based alternative to dashboard-style BI tools. It's a web framework for building data websites.

The "modern" BI layer has a poor developer experience, and decision makers don’t really like the outputs they get. These two issues are closely related. The drag-and-drop experience is so slow and low-leverage that the only way to get all the content on the page is to push a lot of cognitive load onto the end user: global filters, drill down modals, grids of charts without context.

Evidence provides:

- **Code-driven workflows:** Use your IDE, version control, and CI/CD tools
- **First-class text support:** Add context, explanation and insight to your reports using markdown
- **Fast reports:** Pages are pre-built into static HTML websites
- **A lightweight setup:** Install the open source package and start building reports immediately

To get started, [install Evidence](/getting-started/install-evidence)

## How does Evidence work?

<img src='/img/how-it-works.png' width="800px"/>

Evidence renders a BI website from markdown files:

1. [SQL statements](core-concepts/queries) inside markdown files run queries against your data warehouse
1. [Charts and components](core-concepts/components) are rendered using these query results
1. [Templated pages](core-concepts/templated-pages) generate many pages from a single markdown template


## Pre-requisites

To use Evidence you need to know SQL. A knowledge of [basic markdown syntax](markdown) is also helpful.

If you're ready to get started, [install Evidence &#8594](/getting-started/install-evidence)

## Getting help

If you're trying out Evidence, and need some support we'd love to hear from you.
- Message us on <a href='https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q' target="_blank">Slack</a>
- Open an issue on <a href='https://github.com/evidence-dev/evidence' target="_blank">Github</a>
- See all the <a href="https://docs.evidence.dev/components" target="_blank">charts and components</a>.


If there's **anything** you find difficult in the docs, please [open an issue](https://github.com/evidence-dev/evidence/issues/new/choose) or reach out to us on Slack.