---
sidebar_position: 4
title: Hugging Face Spaces
description: Deploy Evidence to Hugging Face Spaces
og:
    image: /img/deployment/deploy-hugging-face-spaces.png
---

Hugging Face is an open-source platform for machine learning and artificial intelligence that provides tools and models for building, training, and deploying AI applications. [Hugging Face Spaces](https://huggingface.co/spaces) is a service that allows you to deploy machine learning models as web applications.

## Prerequisites

- A Hugging Face account
- An Evidence project pushed to a Git service like GitHub

## Deploy your app

1. Navigate to the <a href="https://huggingface.co/spaces" target="_blank" class="markdown">Hugging Face Spaces</a>
1. Select **Create new Space**
    - Choose a name
    - Space SDK: `Static`
    - Static template: `Blank`
    - Choose a visibility: `Public` or `Private` depending on your needs
1. Go to [Access Tokens](https://huggingface.co/settings/tokens) and create a new accesstoken
   - Token Type: `Fine-grained`
   - Name: e.g. `Evidence`
   - Repositories Permissions: Choose the space you just created, and select `Read access to contents of selected repos` `Write access to contents/settings of selected repos`
   - Select Create Token
1. Copy the token, and add it to your GitHub repo as a secret named `HUGGINGFACE_TOKEN`
1. Create the deploy workflow file: `.github/workflows/deploy.yml`, update the repo name and space name, and merge it into your main branch
      ```yaml
      name: Deploy to Hugging Face Space on Merge
      on:
      push:
         branches:
            - main
      workflow_dispatch:

      jobs:
      build_and_deploy:
         runs-on: ubuntu-latest
         steps:
            # Checkout the repository
            - uses: actions/checkout@v4

            # Install dependencies and build the project
            - run: npm ci && npm run sources && npm run build
            env:
               EVIDENCE_SOURCE__taxi__project_id: ${{ secrets.EVIDENCE_SOURCE__TAXI__PROJECT_ID }}
               EVIDENCE_SOURCE__taxi__client_email: ${{ secrets.EVIDENCE_SOURCE__TAXI__CLIENT_EMAIL }}
               EVIDENCE_SOURCE__taxi__private_key: ${{ secrets.EVIDENCE_SOURCE__TAXI__PRIVATE_KEY }}

            # Deploy to Hugging Face Space
            - name: Install Hugging Face CLI
            run: pip install huggingface-hub

            - name: Authenticate with Hugging Face
            run: huggingface-cli login --token "${{ secrets.HUGGINGFACE_TOKEN }}"

            - name: Deploy to Hugging Face Space
            run: |
               # Update to use your repo
               huggingface-cli upload [your-username]/[your-space-name] ./build --repo-type=space

      ```

Your app will be deployed to a URL like `https://[your-username]-[your-space-name].static.hf.space/`

## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

If you chose a private space, only members of your Hugging Face organization will be able to access the space.

### Custom Domains

Custom domains are not supported for Hugging Face Spaces.

### Data refresh

You can adjust the schedule for your deployment using the workflow file by adding a `schedule` trigger with a cron expression.

```yaml
on:
  push:
    branches: 'main'
  schedule:
    # This is every 10 minutes
    - cron: '*/10 * * * *' 
```