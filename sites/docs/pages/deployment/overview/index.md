---
sidebar_position: 1
hide_table_of_contents: false
title: Overview
hide_title: true
description: Evidence is a static site generator, so can be deployed to any static site host. The easiest way to deploy Evidence is on Evidence Cloud.
---

# Deployment Overview

In production, Evidence is a [static site generator](https://www.netlify.com/blog/2020/04/14/what-is-a-static-site-generator-and-3-ways-to-find-the-best-one/) by default. This means it doesn't run queries when someone visits your site, but pre-builds all possible pages as HTML beforehand.

You can host your Evidence app using Evidence Cloud, cloud services like Netlify or Vercel, or your own infrastructure. Evidence does not currently support Github Pages, there is more information on [GitHub](https://github.com/evidence-dev/evidence/issues/603).

You can also configure Evidence as a [Single Page App (SPA)](/deployment/rendering-modes). In SPA mode Evidence will not pre-build all the pages in your application. This can be preferrable if your app has many pages (>1,000) causing long build times.

## Evidence Cloud

The easiest way to deploy Evidence is on [Evidence Cloud](/deployment/evidence-cloud). Evidence Cloud is free for public apps, and has paid plans for private apps.

## Self-host

You can also self-host Evidence anywhere suitable for hosting static sites. See guides for:
- [AWS Amplify](/deployment/aws-amplify)
- [Azure Static Apps](/deployment/azure-static-apps)
- [Cloudflare Pages](/deployment/cloudflare-pages)
- [Firebase](/deployment/firebase)
- [GitHub Pages](/deployment/github-pages)
- [GitLab Pages](/deployment/gitlab-pages)
<!-- - [Hugging Face Spaces](/deployment/hugging-face-spaces) -->
- [Netlify](/deployment/netlify)
- [Vercel](/deployment/vercel)

## Build Process

Evidence doesn't run new queries each time someone visits one of your reports.

Instead, Evidence runs your queries once, at build time, and statically generates _all_ of the pages in your app. This includes all possible permutations of any paramaterized pages.

You can schedule (or trigger) regular builds of your site to keep it up-to-date with your data warehouse.

This has two benefits for you and your users:

1. If something goes wrong with your SQL, Evidence just stops building your app, and continues to serve older results.
2. Your site will be exceptionally fast. Under most conditions, pages will load in milliseconds.

## Build Commands

<Alert status=warning>

Ensure that your build environment aligns with the [system requirements](/guides/system-requirements)

</Alert>

### Build

The command `npm run build` will build a static version of your reports and place them in the `build` directory.

### Build:Strict

The command `npm run build:strict` is a much less permissive build command. Use this to ensure you never deploy a broken report.
This command will fail if:

- **Any SQL query fails.** A successful query returning no rows is _not_ a failure
- **Any component renders an error state.** A component passed a valid query returning no rows _will_ fail - you can avoid this with an [`{#if}` statement](/core-concepts/if-else) if needed.

## Storing Credentials

In production, Evidence expects to find your database credentials in **environment variables**.

To find the environment variables that you'll need to set for your app:

1. Run your app in development mode
1. Visit the [settings page](http://localhost:3000/settings)
1. Open the deployment panel, and select your deployment target

<Alert status=info>

For details on how to use different data for different environments, see [Environments](/deployment/environments).

</Alert>
