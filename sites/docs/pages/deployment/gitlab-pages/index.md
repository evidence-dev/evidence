---
sidebar_position: 4
title: GitLab Pages
description: Deploy Evidence to GitLab Pages
og:
    image: /img/deployment/deploy-gitlab-pages.png
---

[GitLab Pages](https://docs.gitlab.com/ee/user/project/pages/) is a service that allows you to host static websites and single-page apps. Evidence apps can be deployed to GitLab Pages by pushing your Evidence project to a GitLab repository and enabling Pages for the repository.

## Prerequisites

- A [GitLab](https://gitlab.com/) account
- An Evidence project pushed to a GitLab repository

## Deploy your app

1. In <a href="https://gitlab.com/" target="_blank" class="markdown">GitLab</a>, navigate to your Evidence project repository.
1. Add credentials as environment variables
    - Navigate to **Settings > CI/CD > Variables**
    - Click **Add Variable**, and use **Masked** visibility
    - Navigate to your Evidence project and go to the <a href=http://localhost:3000/settings#deploy target="_blank" class="markdown">settings page</a> and copy each of the environment variables keys and values
    - Alternatively, you can find credentials in `connection.options.yaml` files in your `/sources/your_source` directory. The key format used should be `EVIDENCE_SOURCE__[your_source]__[option_name]` (Note the casing matches your source names, and the double underscores). Note that the values are base64 encoded, and will need to be decoded.
1. Return to your GitLab project, and select **Deploy > Pages** in the left sidebar.
1. Get started with GitLab Pages
    - Build image: `node:22`
    - The application files are in the `public` folder: `true` (we'll change this in Evidence later)
    - Installation steps: `npm ci`
    - Build steps: 
        - `npm run sources`
        - `npm run build`
        - `cp -r build public`
    - Add a commit message, and click **Commit**

Your app will be available at `https://[your-repo]-[hexcode].gitlab.io/`. It will be only accessible to your account by default.


## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

GitLab pages are only accessible to your account by default. To make it public, you can change the visibility at:

Settings > General > Visibility, project features and permissions > Pages

### Custom domains

You can add a custom domain by navigating to:

Settings > Pages > Domains > New domain

### Data refresh

You can add a pipeline schedule to refresh your data by navigating to:

Build > Pipeline schedule > Create a new pipeline schedule