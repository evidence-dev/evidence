---
sidebar_position: 4
title: AWS Amplify
breadcrumb: "select 'AWS Amplify' as breadcrumb"
description: Deploy Evidence to AWS Amplify by linking to a Git repository. Amplify supports global passwords for authentication and custom domains.
og:
    image: /img/deployment/deploy-aws-amplify.png
---

[AWS Amplify](https://aws.amazon.com/amplify/) is an AWS service that allows you to create full stack web and mobile apps. Amplify can deploy Evidence apps by linking to a Git repository.

## Prerequisites

- An AWS account
- An Evidence project pushed to a Git service like GitHub, GitLab, or Bitbucket.

## Deploy Evidence to AWS Amplify

1. Login to the <a href="https://console.aws.amazon.com/" target="_blank" class="markdown">AWS Console</a>
2. Navigate to AWS Amplify, and select **Deploy an app** / **Create new app**
3. **Choose source code provider**
    - Select your source code provider (GitHub, Bitbucket, CodeCommit, GitLab). 
    - Click **Next**.
    - Install and authorize the Amplify app on your repository via your Git provider.
4. **Add repository and branch**
    - Use the search box to find the repository containing your Evidence project.
    - Select the branch you want to deploy, 
    - (Optionally select the folder containing your Evidence project if using a monorepo). 
    - Click **Next**.
5. **App settings**
    - Edit the frontend build command: 
        ```code
        npm run sources && npm run build
        ```
    - Edit the build output directory: `build`
    - Open the **Advanced settings** section
        - Build image: `Custom build image`
        - Reference: `public.ecr.aws/docker/library/node:20-bookworm`
        - Click to add new **Environment variables**
        - Copy your environment variables from the Evidence settings page: <a href="http://localhost:3000/settings/#deploy" target="_blank" class="markdown">http://localhost:3000/settings/#deploy</a>
        - Alternatively, you can find credentials in `connection.options.yaml` files in your `/sources/your_source` directory. The key format used should be `EVIDENCE_SOURCE__[your_source]__[option_name]` (Note the casing matches your source names, and the double underscores). Note that the values are base64 encoded, and will need to be decoded.
    - Click **Next**
6. **Review**
    - Review your settings and click **Save and deploy**

Your app will be deployed to https://[branch-name]-[app-id].amplifyapp.com

## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

Your deployed app will be public by default. 

#### Global password

It is possible to set a global site password using AWS Amplify from the console:

Hosting > Access control > Manage access.

#### Cognito

It is also possible to set up auth via [Cognito](https://docs.amplify.aws/react/build-a-backend/auth/).

### Custom domains

Your app will be deployed to https://[branch-name]-[app-id].amplifyapp.com

You can set a custom domain using AWS Amplify from the console:

Hosting > Custom domains > Add domain.

### Data refresh

You can manually refresh your data using AWS Amplify from the console:

[your-app] > Deployments > Redeploy this version.
