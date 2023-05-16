---
sidebar_position: 1
hide_table_of_contents: false
title: Deployment Overview
---

In production, Evidence is a [static site generator](https://www.netlify.com/blog/2020/04/14/what-is-a-static-site-generator-and-3-ways-to-find-the-best-one/). This means it doesn't run queries when someone visits your site, but pre-builds all possible pages as HTML beforehand.

You can host your Evidence project using Evidence Cloud, cloud services like Netlify or Vercel, or your own infrastructure. Evidence does not currently support Github Pages, there is more information on [GitHub](https://github.com/evidence-dev/evidence/issues/603).

## Evidence Cloud

The easiest way to deploy Evidence is on [Evidence Cloud](evidence-cloud). Evidence Cloud is currently in private beta.

## Build Process

Evidence doesn't run new queries each time someone visits one of your reports.

Instead, Evidence runs your queries once, at build time, and statically generates _all_ of the pages in your project. This includes all possible permutations of any paramaterized pages.

You can schedule (or trigger) regular builds of your site to keep it up-to-date with your data warehouse.

This has two benefits for you and your users:

1. If something goes wrong with your SQL, Evidence just stops building your project, and continues to serve older results.
2. Your site will be exceptionally fast. Under most conditions, pages will load in milliseconds.

## Build Commands

### Build

The command `npm run build` will build a static version of your reports and place them in the `build` directory.

### Build:Strict

The command `npm run build:strict` is a much less permissive build command. Use this to ensure you never deploy a broken report.
This command will fail if:

- **Any SQL query fails.** A successful query returning no rows is _not_ a failure
- **Any component renders an error state.** A component passed a valid query returning no rows _will_ fail - you avoid this with a, [{#if} statement](/core-concepts/if-else) if needed.

## Storing Credentials

In production, Evidence expects to find your database credentials in **environment variables**.

To find the environment variables that you'll need to set for your project:

1. Run your project in development mode
1. Visit the [settings page](https://localhost:3000/settings)
1. Open the deployment panel, and select 'self-host'

:::info
For details on how to use different data for different environments, see [Environments](/deployment/environments).
:::
