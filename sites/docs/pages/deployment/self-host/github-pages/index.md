---
sidebar_position: 4
title: GitHub Pages
description: Deploy Evidence to GitHub Pages from a GitHub repo. GitHub Pages can be private to your org, support custom domains, and using Actions for data refresh.
og:
    image: /img/deployment/deploy-github-pages.png
---

GitHub Pages is a static site hosting service that publishes a website from HTML, CSS, and JavaScript files from a repository on GitHub. It optionally runs a build process to create these files. GitHub Pages can deploy Evidence apps from a GitHub repository.

<Alert status="warning">

    **Base Path**

    GitHub Pages serves sites at subpaths of github.io by default, e.g. `https://[username].github.io/your-app`, so you will need to adjust the [base path](/deployment/configuration/base-paths) for your app, unless using a custom domain.
</Alert>

## Prerequisites

- A GitHub account
- An Evidence project pushed to GitHub

## Deploy Evidence to GitHub Pages

1. Adjust the [base path](/deployment/configuration/base-paths) for your app to match the name of your GitHub repository. 
    - If your repo is stored at `https://github.com/username/my-evidence-app`, your base path should be `/my-evidence-app`.
1. Add secrets to your GitHub repo: Settings > Secrets and variables > Actions
    - With your Evidence dev server running, go to the <a href=http://localhost:3000/settings#deploy target="_blank" class="markdown">settings page</a> and copy each of the environment variables
    - Alternatively, you can find credentials in `connection.options.yaml` files in your `/sources/your_source` directory. The key format used should be `EVIDENCE_SOURCE__[your_source]__[option_name]` (Note the casing matches your source names, and the double underscores). Note that the values are base64 encoded, and will need to be decoded.
1. From your GitHub repository, click the **Settings** tab, and then click **Pages** in the Code and automation section.
1. Under **Source**, select **GitHub Actions**
1. Directly underneath, where it says "Use a suggested workflow, browse all workflows or create your own", click **Create your own**, and use the following workflow file, naming it `deploy.yml` or similar. 
    ```yaml
    name: Deploy to GitHub Pages

    on:
      push:
        branches: 'main' # or whichever branch you want to deploy from

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout
            uses: actions/checkout@v4
          - name: Install Node.js
            uses: actions/setup-node@v4
            with:
              node-version: 20
              cache: npm

          - name: Install dependencies
            run: npm install

          - name: build
            env:
              BASE_PATH: '/${{ github.event.repository.name }}'
              ## Add and uncomment any environment variables here
              ## EVIDENCE_SOURCE__my_source__username: ${{ secrets.EVIDENCE_SOURCE__MY_SOURCE__USERNAME }}
              ## EVIDENCE_SOURCE__my_source__private_key: ${{ secrets.EVIDENCE_SOURCE__MY_SOURCE__PRIVATE_KEY }}
            run: |
              npm run sources
              npm run build

          - name: Upload Artifacts
            uses: actions/upload-pages-artifact@v3
            with:
              path: 'build/${{ github.event.repository.name }}'

      deploy:
        needs: build
        runs-on: ubuntu-latest

        permissions:
          pages: write
          id-token: write

        environment:
          name: github-pages
          url: ${{ steps.deployment.outputs.page_url }}

        steps:
          - name: Deploy
            id: deployment
            uses: actions/deploy-pages@v4
    ```
1. Click **Commit changes**, either directly to your branch, or create a PR and merge it to your specified branch.
1. The deploy workflow will run, you can see the progress in the **Actions** tab.

Your app should be available at `https://[username].github.io/[your-app]`.

## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

You can set up a private GitHub Pages site by setting the visibility of the repo to **Private**. This requires a GitHub Enterprise account.

This will mean only GitHub users with access to the repo will be able to access the site.

### Custom domains

You can add a custom domain to your GitHub Pages site. If you do this, you _do not_ need to adjust the base path for your app, as it does not need to be served from a subpath.

You can adjust the domain at:

[your repo] > Settings Tab > Pages > Custom domain

### Data refresh

You can adjust the schedule for your deployment using the workflow file by adding a `schedule` trigger with a cron expression.

```yaml
on:
  push:
    branches: 'main'
  schedule:
    # This is every 10 minutes
    - cron: '*/10 * * * *' 
```