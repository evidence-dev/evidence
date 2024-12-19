---
sidebar_position: 4
title: Firebase
description: Deploy Evidence to Firebase Hosting by linking to a Git repository. Hosting supports custom domains and GitHub Actions for data refresh.
og:
    image: /img/deployment/deploy-firebase.png
---

[Firebase Hosting](https://firebase.google.com/products/hosting) is a GCP service that allows you to host static websites and single-page apps. Firebase Hosting can deploy Evidence apps by linking to a Git repository.

## Prerequisites

- A GCP account
- An Evidence project pushed to Git service like GitHub, GitLab, or Bitbucket.

## Deploy Evidence to Firebase

<Alert status=warning>

**Firebase CLI**

    The Firebase CLI is somewhat buggy, so you sometimes need to try the commands multiple times for them to succeed.
    
</Alert>

1. From the <a href="https://console.firebase.google.com/" target="_blank" class="markdown">Firebase console</a>, click **Create a project**.
    - Enter a project name, accept the terms of service, and click **Continue**.
    - Choose whether to enable Google Analytics (not required), and click **Create project**.
1. In the terminal, install the Firebase CLI:
    ```bash
    npm install -g firebase-tools
    ```
1. Log in to Firebase, and authenticate via the browser:
    ```bash
    firebase login
    ```
1. Initialize Firebase Hosting in your project:
    ```bash
    firebase init hosting
    ```
    - Select `Use an existing project`
    - Select a default Firebase project for this directory: Select project you created
    - What do you want to use as your public directory? `build`
    - Configure as a single-page app (rewrite all URLs to /index.html)? `No`
    - (If asked) File build/index.html already exists. Overwrite? `No`
    - Set up automatic builds and deploys with GitHub? `Yes`
    - Select a GitHub repository to connect to this project: Type your repo name
    - Set up the workflow to run a build script before every deploy? `Yes`
    - What script should be run before every deploy? `npm ci && npm run sources && npm run build`
    - Set up automatic deployment to your site's live channel when a PR is merged? `Yes`
    - What is the name of the GitHub branch associated with your site's live channel? `main`
1. Add secrets to your GitHub repo: Settings > Secrets and variables > Actions
   - With your Evidence dev server running, go to the <a href=http://localhost:3000/settings#deploy target="_blank" class="markdown">settings page</a> and copy each of the environment variables
   - Alternatively, you can find credentials in `connection.options.yaml` files in your `/sources/your_source` directory. The key format used should be `EVIDENCE_SOURCE__[your_source]__[option_name]` (Note the casing matches your source names, and the double underscores). Note that the values are base64 encoded, and will need to be decoded.
   - Add each of them as secrets to your GitHub repo
1. Build your app locally (if you haven't already):
    ```bash
    npm i && npm run sources && npm run build
    ```
1. Deploy your app for the first time
    ```bash
    firebase deploy --only hosting
    ```
1. Edit `firebase-hosting-merge.yml` and `firebase-hosting-pull-request.yml` to add your environment variables as GitHub secrets (note that GitHub capitalizes the names of secrets)
    ```yaml
    - run: npm ci && npm run sources && npm run build
      env:
        EVIDENCE_SOURCE__my_source__username: ${{ secrets.EVIDENCE_SOURCE__MY_SOURCE__USERNAME }}
        EVIDENCE_SOURCE__my_source__private_key: ${{ secrets.EVIDENCE_SOURCE__MY_SOURCE__PRIVATE_KEY }}
    ```
1. Commit and push these newly created files: `firebase.json`, `.firebaserc`,`firebase-hosting-merge.yml`, `firebase-hosting-pull-request.yml`.
1. Update your GitHub workflow settings to allow Workflows to Read and write permissions. This is required for the Pull Request preview GitHub Action to work. [your repo] > Settings > Actions > General > Workflow permissions

Your app should now be live on Firebase Hosting at  `https://<project-id>.web.app`.

## Domains, Authentication and Scheduling

{@partial "evidence-cloud.md"}

### Authentication

Firebase Authentication is _not_ a suitable authentication for static apps on Firebase Hosting.

### Custom domains

You can set up a custom domain on Firebase Hosting. 

[Firebase dashboard](https://console.firebase.google.com/u/0/) > [your project] > Hosting (in the left sidebar) > Domains > Add custom domain

### Data refresh

To adjust your deployment schedule, modify the workflow file in your repository, adding a `schedule` trigger.

```yaml
on:
  schedule:
    - cron: '0 0 * * *' # This is midnight every day
```
