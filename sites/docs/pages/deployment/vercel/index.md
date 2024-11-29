---
sidebar_position: 4
hide_table_of_contents: false
title: Vercel
description: Deploy Evidence to Vercel
og:
    image: /img/deployment/deploy-vercel.png
---

[Vercel](https://vercel.com) is a cloud platform that allows you to simply deploy web applications. Vercel can be used to deploy Evidence from a Git repository.

Vercel lets you host a public version of your app for free, or you can create and host a password-protected version with Vercel's $150/month pro plan.

## Prerequisites

- An Evidence project pushed to a Git service like GitHub, GitLab, or Bitbucket.
- A Vercel account.

## Deploy your app

1. From the <a href="https://vercel.com/dashboard" target="_blank" class="markdown">Vercel dashboard</a>, select **Add new... Project**
1. Import the Git repository containing your Evidence project.
1. Edit the build and output settings:
   - **Build command**: `npm run sources && npm run build`
   - **Output directory**: `build`
1. (If using a monorepo) edit the root directory to point to your Evidence project
1. Edit the environment variables:
   - With your Evidence dev server running, use the **Copy All** button on the <a href=http://localhost:3000/settings#deploy target="_blank" class="markdown">settings page</a>
   - Paste them into the Vercel environment variables section, (they will automatically populate all the fields)
   - Alternatively, you can find credentials in `connection.options.yaml` files in your `/sources/your_source` directory. The key format used should be `EVIDENCE_SOURCE__[your_source]__[option_name]` (Note the casing matches your source names, and the double underscores). Note that the values are base64 encoded, and will need to be decoded.
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
