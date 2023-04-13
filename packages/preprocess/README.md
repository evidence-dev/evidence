# Evidence Preprocess

This package is responsible for transforming Evidence Markdown files into Svelte Components / Pages.

## Overview

The basic pipeline looks something like this:

```mermaid
---
title: Evidence Preprocess Steps
---
flowchart TD
    A(["At Runtime *1"])
    B["At Preprocess"]

    Content[Markdown File]
    ExtractQueries([Discover Queries for Page])
    ExecuteQueries([Execute Queries for Page *2 *3])
    MarkdownToSvelte["Convert Markdown to Svelte"]
    AddScriptTags["Ensure script tags exist"]
    InjectFrontmatter[Inject Frontmatter Tags]

    Content --> A
    A --> ExtractQueries
    ExtractQueries --> ExecuteQueries

    Content --> B
    B --> MarkdownToSvelte
    MarkdownToSvelte --> AddScriptTags
    AddScriptTags --> InjectFrontmatter
```

\*1 Evidence will render with the static adapter by default; which means that "runtime" becomes "buildtime".

\*2 This is handled by the [db-orchestrator package](../db-orchestrator/), not preprocess - but it is an important step.

\*3 This occurs in [`/pages/api/[route].json`](../../sites/example-project//src/pages/api/%5Broute%5D.json/%2Bserver.js). The Svelte Static Adapter pre-renders the result JSON files.
