<!-- TODO: replace -->
![evidence-logo](sites/docs/static/img/evidence.svg)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# Business Intelligence as Code

Evidence is an open source, code-based alternative to drag-and-drop business intelligence tools.

You write SQL queries alongside markdown files and Evidence compiles them into a data website.

# How It Works
Evidence creates pages from markdown files. When you add SQL queries, Evidence runs them against your database.

![how-it-works](sites/docs/static/img/how-it-works.png)

You can reference the results of those queries directly in your markdown document's text, or you can use them to make charts, graphs, and tables using our built-in components.

Evidence renders a BI website from markdown files:

- **SQL statements** inside markdown files run queries against your data warehouse
- **Charts and components** are rendered using these query results
- **Templated pages** generate many pages from a single markdown template
- **Loops** and **If / Else** statements allow control of what is displayed to users

# Getting Started

## Installation 

**Try Online:**

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/evidence?file=pages%2Findex.md)

**Install Locally:**

Check out the [documentation](https://docs.evidence.dev) for a walkthrough and other install options.

```
npx degit evidence-dev/template my-project
cd my-project 
npm install 
npm run dev 
```

# Join the Evidence Community
Join our [Slack channel](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q) to get involved in the community's discussion, share what you're working on, or request features.

Follow us on [Twitter](https://twitter.com/evidence_dev) to receive the latest updates on Evidence.


# Contributing 
If you are interested in contributing, please join us on our [slack channel](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q), open an [issue](https://github.com/evidence-dev/evidence/issues/new), or contribute a pull request.  

# License
Evidence is licensed under the MIT license. See the [LICENSE](LICENSE.md) file for licensing information.
