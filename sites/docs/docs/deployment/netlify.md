---
sidebar_position: 3
hide_table_of_contents: false
title: Netlify
---

Netlify lets you host a public version of your project for free, or you can create and host a password-protected version with Netlify's $15/month plan.

## Deploy to Netlify

1. Run your project in development mode
1. Visit the [settings page](https://localhost:3000/settings)
1. Open the deployment panel, and select 'netlify', then follow the provided instructions

## Optional: Set a site-wide password for your project (Requires Paid Plan)

Follow the directions provided by Netlify to set up a password for your site:
https://docs.netlify.com/visitor-access/password-protection/

## Optional: Schedule updates using Build Hooks

If you want your site to update on a regular schedule, you can use GitHub Actions (or another similar service) to schedule regular calls to a [Netlify build hook](https://docs.netlify.com/configure-builds/build-hooks/).

1. Create a [Netlify build hook](https://docs.netlify.com/configure-builds/build-hooks/) in **Site settings > Build & deploy > Continuous deployment > Build hooks**
   ![netlify-add-build-hook](/img/netlify-add-build-hook.png)
   This will give you a URL that GitHub will use to trigger builds

2. Add `NETLIFY_BUILD_HOOK` to your Github Repo's Secrets

- In your GitHub repo, go to Settings > Secrets > Actions and click **New repository secret**<br/><br/>
  ![netlify-github-new-secret](/img/netlify-github-new-secret.png)
  ![netlify-github-secret](/img/netlify-github-secret.png)

3. Add a schedule file to your project

- Create a new directory in your project called `.github`
- Within that directory, create another called `workflows`
- Add a new file in `.github/workflows` called `main.yml`

4. Add the following text to the `main.yml` file you just created. Be sure that the spacing and indentation is exactly as presented here, as it will impact whether the action runs correctly

```yaml
name: Schedule Netlify Build
on:
  workflow_dispatch:
  schedule:
    - cron: '0 10 * * *' # Once a day around 6am ET (10am UTC)
jobs:
  build:
    name: Request Netlify Webhook
    runs-on: ubuntu-latest
    steps:
      - name: POST to Build Hook
        env:
          BUILD_HOOK: ${{ secrets.NETLIFY_BUILD_HOOK }}
        run: curl -X POST -d {} $BUILD_HOOK
```

5. See your GitHub Actions run in the **Actions** tab of your GitHub repo
