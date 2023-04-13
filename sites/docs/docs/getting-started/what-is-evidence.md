---
sidebar_position: 1
slug: /
title: What is Evidence?
hide_table_of_contents: true
hide_title: false
breadcrumbs: false
image: /img/how-it-works.png
---

Evidence is a web framework for data analysts. It’s an open source, code-based alternative to drag-and-drop business intelligence tools.

## Motivation

Our goal is to enable data analysts to deliver reliable, clear, and valuable reporting products driven by live data.

We believe that the best way to achieve that goal is to equip analysts with a higher leverage workflow than dragging-and-dropping charts and filters onto a dashboard.

Evidence provides:

- **Code-driven workflows:** Use your IDE, version control, and CI/CD tools
- **First-class text support:** Add context, explanation and insight to your reports using markdown
- **Control structures:** Use loops, conditionals, and parameterized pages to generate content from data
- **Performance:** Evidence projects build into fast and reliable web application
- **Lightweight setup:** Install locally and start building reports immediately

To get started, [install Evidence](/getting-started/install-evidence).

## How does Evidence work?

<img src='/img/how-it-works.png' width="800px"/>

Evidence renders a BI website from markdown files:

1. [SQL statements](core-concepts/queries) inside markdown files run queries against your data warehouse
1. [Charts and components](core-concepts/components) are rendered using these query results
1. [Templated pages](core-concepts/templated-pages) generate many pages from a single markdown template
1. [Loops](core-concepts/loops) and [If / Else](core-concepts/if-else) statements allow control of what is displayed to users

## Pre-requisites

To use Evidence you need to know SQL. A knowledge of [basic markdown syntax](markdown) is also helpful.

## Getting help

If you're trying out Evidence, and need some support we'd love to hear from you.

- Message us on <a href='https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q' target="_blank">Slack</a>
- Open an issue on <a href='https://github.com/evidence-dev/evidence' target="_blank">Github</a>
- See all the <a href="https://docs.evidence.dev/components/all-components" target="_blank">charts and components</a>.

If there's **anything** you find difficult in the docs, please [open an issue](https://github.com/evidence-dev/evidence/issues/new/choose) or reach out to us on Slack.
