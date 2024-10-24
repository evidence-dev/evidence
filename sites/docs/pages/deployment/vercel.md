---
sidebar_position: 4
hide_table_of_contents: false
title: Vercel
description: Deploy a public app to Vercel for free or a password-protected app with the pro plan.
---


<Alert status=danger>

**Missing DuckDB Dependencies**

Note that because of missing dependencies, Vercel cannot be used with DuckDB sources. Consider [Evidence Cloud](/deployment/evidence-cloud) or [Netlify](/deployment/netlify) as an alternative if you are using DuckDB. 

</Alert>

Vercel lets you host a public version of your app for free, or you can create and host a password-protected version with Vercel's $150/month pro plan. [Netlify](/deployment/netlify) offers the same option for $15/month.

## Deploy to Vercel

1. Run your app in development mode
1. Visit the [settings page](http://localhost:3000/settings)
1. Open the deployment panel, and select 'Vercel', then follow the provided instructions

## Optional: Set a site-wide password for your app (Requires Paid Plan)

Follow the directions provided by Vercel to set up a password for your site:
https://vercel.com/blog/protecting-deployments

## Optional: Schedule updates using Deploy Hooks

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
