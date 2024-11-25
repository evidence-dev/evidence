---
sidebar_position: 4
title: Azure Static Apps
description: Deploy Evidence to Azure Static Apps
---

Azure Static Apps is a service that allows you to deploy static websites and web apps to Azure.

## Prerequisites

- An AWS account
- An Evidence project pushed to a Git service like GitHub or Azure DevOps

## Deploy your app

1. Select **Create a Resource** in the Azure Portal, and choose **Static Web App**
1. Select Create Static Web app
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


## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}