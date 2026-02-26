---
sidebar_position: 4
title: Azure Static Apps
description: Deploy Evidence to Azure Static Apps by linking a Git repository. Static Apps support global passwords, Entra ID, custom domains, and GitHub Actions for refresh.
og:
    image: /img/deployment/deploy-azure-static-apps.png
---

[Azure Static Apps](https://learn.microsoft.com/en-us/azure/static-web-apps) is a Microsoft Azure service that allows you to deploy static websites and web apps to Azure. Azure Static Apps can deploy Evidence apps by linking to a Git repository.

## Prerequisites

- A Microsoft Azure account
- An Evidence project pushed to a Git service like GitHub or Azure DevOps

## Deploy Evidence to Azure Static Apps

1. In the <a href="https://portal.azure.com/" target="_blank" class="markdown">Azure Portal</a>, select **Create a Resource** and choose **Static Web App**
1. Basics
   - Choose a subscription, and resource group for the app
   - Choose a name for the app
   - Choose a plan type: Free, Standard or Dedicated
   - Choose a source code provider: GitHub, Azure DevOps or Other
   - Authenticate with your Git provider
   - Choose a repository, and branch to deploy from
   - Build presets: `Custom`
   - Output location `/build`
1. Deployment configuration
   - Choose either a deployment token, or (recommended) GitHub to deploy your code
1. Advanced and Tags: No changes needed
1. Review and create: Click Create
1. This will create add a new workflow file in your repository, e.g. `.github/workflows/azure-static-web-apps-thankful-hill-01fbff51e.yml`
1. Add secrets to your GitHub repo: Settings > Secrets and variables > Actions
    - With your Evidence dev server running, go to the <a href=http://localhost:3000/settings#deploy target="_blank" class="markdown">settings page</a> and copy each of the environment variables into the GitHub secrets
    - Alternatively, you can find credentials in `connection.options.yaml` files in your `/sources/your_source` directory. The key format used should be `EVIDENCE_SOURCE__[your_source]__[option_name]` (Note the casing matches your source names, and the double underscores). Note that the values are base64 encoded, and will need to be decoded.
1. In your git repo, edit this file's "Build and Deploy" step, adding `app_build_command: "npm run sources && npm run build"`, and environment variables to reference the secrets
      ```yaml
            - name: Build And Deploy
            id: builddeploy
            uses: Azure/static-web-apps-deploy@v1
            with:
               ...
               # Add this line
               app_build_command: "npm run sources && npm run build" 
               ###### End of Repository/Build Configurations ######
            env: 
               # Add and uncomment your environment variables here
               # Note that GitHub capitalizes the names of secrets, but Evidence requires the casing to match your source and option names
               # EVIDENCE_SOURCE__my_source__username: ${{ secrets.EVIDENCE_SOURCE__MY_SOURCE__USERNAME }}
               # EVIDENCE_SOURCE__my_source__private_key: ${{ secrets.EVIDENCE_SOURCE__MY_SOURCE__PRIVATE_KEY }}
      ```
1. Commit and push this change, and your app will deploy.

Your app will be available at `https://[random-word-12345].azurestaticapps.net`

## Domains, Authentication and Scheduling

### Authentication

You can add a global site password to your app: 

[your-app] > Settings > Configuration > Password protection > Protect both staging and production environments

You can also configure other authentication providers, such as Microsoft Entra ID, or GitHub. See the [official docs](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization#set-up-sign-in) for more information.

### Custom Domains

You can add a custom domain to your Azure Static App as follows:

[your-app] > Settings > Custom domains > Add > Custom domain on other DNS

### Data Refresh

To add a deployment schedule, modify the workflow file in your repository, adding a `schedule` trigger.

```yaml
on:
  push:
    branches: 'main'
  schedule:
    - cron: '0 0 * * *' # This is midnight every day
```

Also delete the `if` line from the `build_and_deploy_job` step:

```yaml
build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed') # delete this line
```
