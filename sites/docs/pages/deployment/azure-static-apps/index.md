---
sidebar_position: 4
title: Azure Static Apps
description: Deploy Evidence to Azure Static Apps
---

[Azure Static Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/) is a Microsoft Azure service that allows you to deploy static websites and web apps to Azure.

## Prerequisites

- A Microsoft Azure account
- An Evidence project pushed to a Git service like GitHub or Azure DevOps

## Deploy your app

1. In the [Azure Portal](https://portal.azure.com/), select **Create a Resource** and choose **Static Web App**
1. Basics
   - Choose a subscription, and resource group for the app
   - Choose a name for the app
   - Choose a plan type: Free, Standard or Dedicated
   - Choose a source code provider: GitHub, Azure DevOps or Other
   - Authenticate with your Git provider
   - Choose a repository, and branch to deploy from
   - Output location `/build`
1. Deployment configuration
   - Choose either a deployment token, or (recommended) GitHub Identity to deploy your code
1. Advanced and Tags: No changes needed
1. Review and create
1. This will create add a new workflow file in your repository, e.g. `.github/workflows/azure-static-web-apps-thankful-hill-01fbff51e.yml`
1. Add secrets to your GitHub repo: Settings > Secrets > Actions
   - With your Evidence dev server running, go to the [settings page](http://localhost:3000/settings#deploy) and copy each of the environment variables
   - Add each of them as secrets to your GitHub repo
1. Edit this file's "Build and Deploy" step, adding `app_build_command: "npm run sources && npm run build"`, and adding your environment variables as secrets.
      ```yaml
            - name: Build And Deploy
            id: builddeploy
            uses: Azure/static-web-apps-deploy@v1
            with:
               azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_THANKFUL_HILL_01FBFF51E }}
               action: "upload"
               ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
               # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
               app_location: "/" # App source code path
               api_location: "" # Api source code path - optional
               output_location: "/build" # Built app content directory - optional
               app_build_command: "npm run sources && npm run build"
               github_id_token: ${{ steps.idtoken.outputs.result }}
               ###### End of Repository/Build Configurations ######
            env:
               YOUR_EVIDENCE_ENV_VAR: ${{ secrets.YOUR_EVIDENCE_ENV_VAR }}
               ANOTHER_EVIDENCE_ENV_VAR: ${{ secrets.ANOTHER_EVIDENCE_ENV_VAR }}
      ```
1. Commit and push this change, and your app will deploy.

Your app will be available at <https://[random-word-12345].azurestaticapps.net/>.

## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

You can add a global site password to your app: 

[your-app] > Settings > Configuration > Password protection > Protect both staging and production environments

You can also configure other authentication providers, such as Microsoft Entra ID, or GitHub. See the [official docs](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization#set-up-sign-in) for more information.

### Custom Domains

You can add a custom domain to your Azure Static App as follows:

[your-app] > Settings > Custom domains > Add > Custom domain on other DNS

### Data Refresh

To adjust your deployment schedule, modify the workflow file in your repository.

```yaml
on:
  push:
    branches: 'main'
  schedule:
    - cron: '0 0 * * *' # This is midnight every day
```
