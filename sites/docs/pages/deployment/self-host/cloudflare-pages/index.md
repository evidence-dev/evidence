---
sidebar_position: 4
title: Cloudflare Pages
description: Deploy Evidence to Cloudflare Pages by linking to a Git repository. Pages supports auth via Cloudflare Access and custom domains.
og:
    image: /img/deployment/deploy-cloudflare-pages.png
---

Cloudflare is a popular CDN and DNS provider that also offers a static site hosting service called [Cloudflare Pages](https://pages.cloudflare.com). Cloudflare Pages can deploy Evidence apps from a Git repository.

## Prerequisites

- A Cloudflare account
- An Evidence project pushed to a Git service like GitHub or GitLab

## Deploy Evidence to Cloudflare Pages

1. Navigate to the <a href="https://dash.cloudflare.com/" target="_blank" class="markdown">Cloudflare dashboard</a>
1. Select **Workers & Pages** from the left-hand menu, and select **Create**
1. There are two tabs: **Workers** and **Pages** - choose **Pages**
1. Select **Connect to Git**, and choose GitHub or GitLab
1. Select Repository
   - Authenticate with your Git provider
   - Choose the repository to deploy from
   - You may need to configure repository access permissions
1. Set up builds and deployments
   - Choose a production branch
   - Set the build command: `npm run sources && npm run build`
   - Set the build output directory: `/build`
1. (Optionally select the root path containing your Evidence project if using a monorepo)
1. Add environment variables
   - Click **Add variable**
   - With your Evidence dev server running, go to the <a href=http://localhost:3000/settings#deploy target="_blank" class="markdown">settings page</a> and copy each of the environment variables
   - Paste them into the Cloudflare Pages environment variables section
1. Click **Save and Deploy**

Your app will be deployed to a URL like `https://[repo-name].pages.dev`. It can take a few minutes for the site to be available after deployment.

## Domains, Authentication and Scheduling

### Authentication

By default, your app will be public.

Authentication can be configured with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/identity/access).

Workers & Pages > [Your app] > Settings > General > Access Policy > Manage

You will need to set up access groups and policies to control access to your app. A one time PIN code can be configured for user login.

## Custom Domains

Cloudflare Pages supports custom domains.

Workers & Pages > [Your app] > Custom Domains > Set up a custom domain

## Data refresh

Cloudflare Pages does not have built in functionality for data refresh.
