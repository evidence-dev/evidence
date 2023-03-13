---
sidebar_position: 1
slug: /
title: Evidence
hide_table_of_contents: true
hide_title: false
breadcrumbs: false
---

## Business Intelligence as Code

Evidence is a web framework for data analysts. It's an open source, code-driven alternative to drag-and-drop BI tools. 

## Why Evidence?

Most BI tools are _frustrating_. Evidence re-imagines the BI development experience:

- **Code-driven workflows:** Use your IDE, version control, and CI/CD tools
- **First-class text support:** Add context, explanation and insight to your reports
- **Blazing-fast reports:** No more loading wheels - Evidence pre-builds everything
- **Lightweight setup:** Install and start building reports in minutes
- **Publication-grade outputs:** A data experience you can be proud to give your users

## How does Evidence work?

<div class="how-it-works">
<img src='/img/how-it-works.png' class="how-it-works"/>
</div>

Evidence renders a BI website from markdown files:

1. [SQL statements](core-concepts/queries) inside markdown files run queries against your data warehouse
1. [Charts and components](core-concepts/components) are rendered using these query results
1. [Loops and conditionals](core-concepts/loops-and-conditionals) allow displayed page content to be programmatically controlled
1. [Templated pages](core-concepts/templated-pages) generate many pages from a single markdown template


## Pre-requisites

To use Evidence you need to know SQL. A knowledge of [basic markdown syntax](markdown) is also helpful.

If you're ready to get started, [install Evidence &#8594](/getting-started/install-evidence)

:::note Public Alpha
Evidence is in public alpha: there will be bugs and things will change before we reach a stable release.
:::

## Getting help

If you're trying out Evidence, and need some support we'd love to hear from you.
- Message us on <a href='https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q' target="_blank">Slack</a>
- Open an issue on <a href='https://github.com/evidence-dev/evidence' target="_blank">Github</a>
- See all the <a href="https://docs.evidence.dev/components" target="_blank">charts and components</a>.


If there's **anything** you find difficult in the docs, please [open an issue](https://github.com/evidence-dev/evidence/issues/new/choose) or reach out to us on Slack.