---
title: Base Paths
sidebar_position: 6
description: Evidence supports serving your app from a subdirectory, for example https://acme.com/analytics.
---

Evidence supports serving your app from a subdirectory. For example, you can serve your app from `https://acme.com/analytics`. 

This can be useful for embedded reporting, where you want to use the root domain for your main app and serve Evidence reports from a subdirectory.

## Configuring the Base Path

Add the following to `evidence.config.yaml` at the project root:

```yaml
deployment:
  basePath: /my-base-path
```

**All links in your markdown files will be automatically adjusted** to include the base path.

The base path must:
- Start with a `/`
- **Not** end with a `/`
- Be a valid URL path

Your `pages/index.md` file will be served from `https://my-domain.com/my-base-path`, and other pages will be served relative to this path.

## Configuring the Build Directory in `package.json`

Evidence builds your app to the `build` directory, rather than to `build/my-base-path`.

To modify the build directory, set the `EVIDENCE_BUILD_DIR` environment variable in `package.json`

```json
  "build": "EVIDENCE_BUILD_DIR=./build/my-base-path evidence build"
```

This is required to use the `npm run preview` command, or else the preview will not run correctly.

## Custom Components

[Custom components](/components/custom/custom-component) links are **not automatically adjusted** to include the base path. Links should be adjusted using the `addBasePath` utility function, which adjusts relative links to include the base path.

For example:

`CustomLink.svelte`:
```svelte
&lt;script&gt;
  export let link;
  import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
&lt;/script&gt;

<a href={addBasePath(link)}>My Component</a>
```