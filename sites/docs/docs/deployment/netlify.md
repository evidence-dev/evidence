---
sidebar_position: 2
hide_table_of_contents: false
title: Netlify
---

Netlify lets you host a public version of your project for free, or you can create and host a password-protected version with Netlify's $15/month plan.

## Sign up for Netlify for free
You can sign up for Netlify [here](https://app.netlify.com/signup)

## Connect Netlify to your Evidence project
1. On your overview page, click to create a new site from Git:
![netlify-new-site-git](/img/netlify-new-site-git.png)
1. Follow the prompts from Netlify to connect to your GitHub and choose the repo containing your Evidence project
1. Use the default options supplied by Netlify and click Deploy Site. Netlify will start building your site and you should see the screen below:
![netlify-first-deploy](/img/netlify-first-deploy.png)

## Add Environment Variables
Since your database credentials are not checked into version control (they are included in the `.gitignore` file in your project), you need to provide Netlify with the credentials to access your database. You can set up environment variables in Netlify for this.

1. Go to Site Settings
1. Under Build & deploy, go to Environment
1. Click Edit in the Environment Variables section
1. Add each required environment variable to connect to your database (see below for the required variables based on which database you're using)

![env-vars-edit](/img/env-vars-edit.png)

### PostgreSQL
![env_vars_pg_done](/img/env_vars_pg_done.png)

### Snowflake
![env_vars_sf_done](/img/env_vars_sf_done.png)

### BigQuery
You will need the 3 variables below from the JSON key file you generated for your BigQuery service account. If you don't have a JSON key file, see [Connect Data Warehouse](/getting-started/connect-data-warehouse#bigquery).

![env_vars_bq_done](/img/env_vars_bq_done.png)

## Deploy your project
Netlify will already have deployed a version of your site without the environment variables, but now you'll need to update it so the queries in your project work.

Go to Deploys and click Trigger deploy - this will kickstart a new build of your project.

![netlify-trigger-deploy](/img/netlify-trigger-deploy.png)

Once the deploy is complete, refresh your project site and your queries should be working. 

:::note 
If you run into any problems with deployment, please [reach out on Slack](/community) or send an email to <support@evidence.dev>.
:::

## Optional: Set a site-wide password for your project (Requires Paid Plan) 
Follow the directions provided by Netlify to set up a password for your site:
https://docs.netlify.com/visitor-access/password-protection/

## Optional: Schedule updates using Github Actions 
If you want your site to update on a specific schedule, you can use GitHub Actions. You provide a schedule in your GitHub repo (details below) and GitHub will send a request to Netlify to trigger a rebuild of your site on that schedule (using a specific URL provided by Netlify; AKA a build hook).

1. Create a [Netlify build hook](https://docs.netlify.com/configure-builds/build-hooks/) in **Site settings > Build & deploy > Continuous deployment > Build hooks**
![netlify-add-build-hook](/img/netlify-add-build-hook.png)
This will give you a URL that GitHub will use to trigger builds

2. Add `NETLIFY_BUILD_HOOK` to your Github Repo's Secrets 
*  In your GitHub repo, go to Settings > Secrets > Actions and click **New repository secret**<br/><br/>
![netlify-github-new-secret](/img/netlify-github-new-secret.png)
![netlify-github-secret](/img/netlify-github-secret.png)
3. Add a schedule file to your project
* Create a new directory in your project called `.github`
* Within that directory, create another called `workflows`
* Add a new file in `.github/workflows` called `main.yml`
4. Add the following text to the `main.yml` file you just created. Be sure that the spacing and indentation is exactly as presented here, as it will impact whether the action runs correctly

```
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

