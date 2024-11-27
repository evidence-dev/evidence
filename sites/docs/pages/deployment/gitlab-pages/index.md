---
sidebar_position: 4
title: GitLab Pages
description: Deploy Evidence to GitLab Pages
---

[GitLab Pages](https://docs.gitlab.com/ee/user/project/pages/) is a service that allows you to host static websites and single-page apps. Evidence apps can be deployed to GitLab Pages by pushing your Evidence project to a GitLab repository and enabling Pages for the repository.

## Prerequisites

- A [GitLab](https://gitlab.com/) account
- An Evidence project pushed to a GitLab repository

## Deploy your app

1. Navigate to your Evidence project repository in [GitLab](https://gitlab.com/).
1. Select **Deploy > Pages** in the left sidebar.
1. Get started with GitLab Pages
    - Build image: `node:22`
    - The application files are in the `public` folder: `true` (we'll change this in Evidence later)
    - Installation steps: `npm ci`
    - Build steps: 
        - `npm run sources`
        - `npm run build`
        - `cp -r build public`
    - Add a commit message, and click **Commit**

Your app will be available at <https://[your-repo]-[hexcode].gitlab.io/>.


## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

### Custom domains

### Data refresh