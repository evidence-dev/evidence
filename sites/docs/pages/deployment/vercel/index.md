---
sidebar_position: 4
hide_table_of_contents: false
title: Vercel
description: Deploy a public Evidence app to Vercel for free or a password-protected Evidence app with the pro plan.
---

<Alert status=danger>

**Missing DuckDB Dependencies**

Note that because of missing dependencies, Vercel cannot be used with DuckDB data sources. Consider [Evidence Cloud](/deployment/evidence-cloud) or [Netlify](/deployment/netlify) as an alternative if you are using DuckDB as a data source. 

</Alert>

[Vercel](https://vercel.com) is a cloud platform that allows you to simply deploy web applications, including Evidence apps.

Vercel lets you host a public version of your app for free, or you can create and host a password-protected version with Vercel's $150/month pro plan.

## Prerequisites

- An Evidence project pushed to a Git service like GitHub, GitLab, or Bitbucket.
- A Vercel account.

## Deploy your app

1. From the Vercel dashboard, select **Add new... Project**
1. Import the Git repository containing your Evidence project.
1. Edit the build and output settings:
   - **Build command**: `npm run sources && npm run build`
   - **Output directory**: `build`
1. (If using a monorepo) edit the root directory to point to your Evidence project
1. Edit the environment variables:
   - With your Evidence dev server running, use the **Copy All** button on the [settings page](http://localhost:3000/settings#deploy)
   - Paste them into the Vercel environment variables section, (they will automatically populate all the fields)
1. Click **Deploy**

Your app will be deployed to https://[project-name].vercel.app

## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

Your deployed app will be public by default. 

#### Global password

This requires a Vercel paid plan with [advanced deployment protection](https://vercel.com/docs/security/deployment-protection#advanced-deployment-protection), starting at $150/month.

Vercel Dashboard > [your-project] > Settings > Deployment Protection > Password protection

### Custom domains

Your app will be deployed to https://[project-name].vercel.app

You can set a custom domain using Vercel from the console:

Vercel Dashboard > [your-project] > Settings > Domains

### Data refresh

Your project will be automatically built when you push to your repository, refreshing your data.

#### Schedule updates using Deploy Hooks

If you want your site to update on a specific schedule, you can use GitHub Actions (or another similar service) to schedule regular calls to a [Vercel deploy hook](https://vercel.com/docs/concepts/git/deploy-hooks).

1. Create a [Vercel deploy hook](https://vercel.com/docs/concepts/git/deploy-hooks).
   This will give you a URL that GitHub will use to trigger builds
2. Add `VERCEL_DEPLOY_HOOK` to your Github Repo's Secrets
   - In your GitHub repo, go to Settings > Secrets > Actions and click **New repository secret** and create a secret, `VERCEL_DEPLOY_HOOK`, with the URL from step 1.
3. Add a schedule file to your project
   - Create a new directory in your project called `.github`
   - Within that directory, create another called `workflows`
   - Add a new file in `.github/workflows` called `main.yml`
4. Add the following text to the `main.yml` file you just created. Be sure that the indentation in your `main.yml` matches the below.
```yaml
name: Schedule Vercel Deploy
on:
  workflow_dispatch:
  schedule:
    - cron: '0 10 * * *' # Once a day around 6am ET (10am UTC)
jobs:
  build:
    name: Request Vercel Webhook
    runs-on: ubuntu-latest
    steps:
      - name: POST to Deploy Hook
        env:
          BUILD_HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK }}
        run: curl -X POST -d {} $BUILD_HOOK
```
5. See your GitHub Actions run in the **Actions** tab of your GitHub repo
