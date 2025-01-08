---
sidebar_position: 1
title: What is Evidence? | Evidence Docs
description: Evidence is an open source framework for building data products with SQL - things like reports, decision-support tools, and customer-facing/embedded reporting. It's a code-driven alternative to drag-and-drop BI tools.
hide_title: true
og:
  image: /img/how-it-works.png
---

# What is Evidence?

Evidence is an open source framework for building data products with SQL - things like reports, decision-support tools, and embedded dashboards. It's a code-driven alternative to drag-and-drop BI tools.

This docs site is an Evidence app.

Install Evidence with the [VSCode Extension](vscode:extension/Evidence.evidence-vscode), or see other [installation options](/install-evidence).

## How does Evidence work?

<img src='/img/how-it-works.png' width="800px"/>

Evidence renders a BI website from markdown files:

1. [Data sources](/core-concepts/data-sources) can include data warehouses, flat files and non-SQL data sources
1. [SQL statements](/core-concepts/queries) inside markdown files run queries against data sources
1. [Charts and components](/core-concepts/components) are rendered using these query results
1. [Templated pages](/core-concepts/templated-pages) generate many pages from a single markdown template
1. [Loops](/core-concepts/loops) and [If / Else](/core-concepts/if-else) statements allow control of what is displayed to users

## Pre-requisites

To use Evidence you need to know SQL. A knowledge of [basic markdown syntax](/reference/markdown) is also helpful.

## Getting help

If you're trying out Evidence, and need some support we'd love to hear from you.

- Message us on <a href='https://slack.evidence.dev' target="_blank">Slack</a>
- Open an issue on <a href='https://github.com/evidence-dev/evidence' target="_blank">Github</a>
- See all the <a href="/components/all-components" target="_blank">charts and components</a>.

If there's **anything** you find difficult in the docs, please [open an issue](https://github.com/evidence-dev/evidence/issues/new/choose) or reach out to us on Slack.
