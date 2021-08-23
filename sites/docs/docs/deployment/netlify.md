---
sidebar_position: 2
hide_table_of_contents: false
title: Netlify
---

## Overview 

1. Sign up for netlify 
1. Connect your netlify project to the github repo containing your evidence project 
1. Add environment variables for each of your database connection paramaters
1. Optional: Set a site-wide password for your project (Requires Paid Plan) 

## Optional: Schedule updates using Github Actions 

1. Get your netlify build hook 
1. Add `NETLIFY_BUILD_HOOK` to your Github Repo's Secrets 
1. Add a new file to your project `.github/workflows/main.yml` 
1. Add the following text to the file you just created 

```
    name: Schedule Netlify Build
    on:
    workflow_dispatch:
    schedule:
        - cron: '0 14 * * *' # Once a day around 10am ET
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

