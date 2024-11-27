---
sidebar_position: 4
title: AWS Amplify
breadcrumb: "select 'AWS Amplify' as breadcrumb"
description: Deploy Evidence to AWS Amplify
og:
    image: /img/deployment/deploy-aws-amplify.png
---

[AWS Amplify](https://aws.amazon.com/amplify/) is an AWS service that allows you to create full stack web and mobile apps. It can be used to deploy Evidence apps by linking your Evidence project.

## Prerequisites

- An AWS account
- An Evidence project pushed to a Git service like GitHub, GitLab, or Bitbucket.

## Deploy your app

1. Login to the [AWS Console](https://console.aws.amazon.com/)
2. Navigate to AWS Amplify, and select **Deploy an app** / **Create app**
3. Choose source code provider
    - Select your source code provider (GitHub, GitLab, Bitbucket or CodeCommit). 
    - Click **Next**.
    - Install and authorize the Amplify app on your repository.
4. Add repository and branch
    - Use the search box to find the repository containing your Evidence project.
    - Select the branch you want to deploy, 
    - (Optionally select the folder containing your Evidence project if using a monorepo). 
    - Click **Next**.
5. App settings
    - Edit the frontend build command: `npm run sources && npm run build`
    - Edit the build output directory: `build`
    - Open the **Advanced settings** section
        - Click to add new **Environment variables**
        - Copy your environment variables from the Evidence settings page: http://localhost:3000/settings/#deploy
    - Click **Next**
6. Review
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
