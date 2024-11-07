---
sidebar_position: 2
hide_table_of_contents: false
title: Evidence Cloud
description: Evidence Cloud is a hosting service that allows you to securely host Evidence apps. It's the easiest way to host an Evidence app, without having to worry about maintaining your own infrastructure.
---

## What is Evidence Cloud?

Evidence Cloud is our hosting service that allows you to securely host Evidence apps.

It's the easiest way to host an Evidence app, without having to worry about maintaining your own infrastructure.

### Key Features

- **Easy to set up:** Deploy in 5 minutes without configuring any infrastructure.
- **Secure:** Manage access for users in your team.
- **Organizational domain:** Host your app at `[organisation].evidence.app`.
- **Scheduled refreshes:** Daily (or more frequent) data updates to your app.
- **Re-build on push:** Merge to your target branch to rebuild your app.

## Sign Up

Evidence Cloud is now generally available. You can sign up below.

<LinkButton url="https://evidence.app"> Sign Up </LinkButton>

<br/>
<br/>

## How do I set up Evidence Cloud

Setting up Evidence Cloud takes less than 5 minutes.

1. Go to [evidence.app](https://evidence.app) and sign in with GitHub
1. Choose an option to get started:
   1. **If you have an existing app:** click `Deploy Evidence Project`
   1. **If you don't have a app yet**, select `Create New Project from Template`, then return to [evidence.app](https://evidence.app) after creating your template app in GitHub
1. Enter your deployment details, including the GitHub repo you want to use, and the domain you want to deploy it to
1. Add your credentials, either from your local app or from the template
1. Click `Deploy your project`


## Frequently Asked Questions

### Features


<Details title="What causes my data to update?">

- Pushes to your target branch.
- Clicking the `Redeploy` button in the UI.
- You can set up a regularly scheduled refresh on some of our plans.

</Details>

<Details title="How frequently does Evidence Cloud refresh my data?">
You can set up data refreshes as regularly as you need on the Team and Enterprise plans.
</Details>

<Details title="How does authentication work for my private app?">

    Each viewer account is provided with a unique login to access the app. You can manage viewers in the Evidence Cloud UI.
</Details>

<Details title="Can I create a public Evidence Cloud site?">

    Yes! Our Free plan allows you to create public sites.
</Details>

<Details title="How do I set up development previews?">

Alongside your `main` branch, set up a secondary app targeting a development branch (e.g. `dev`) whenever you merge changes into `dev`, you will get a preview. When you are ready to release changes, merge these into `main`.

You can set up different database credentials for development deployments, which allows 
you to use development data before it is in your production db.

</Details>



### Pricing

<Details title="Is Evidence Cloud free?">

Evidence Cloud's Free tier offers unlimited public apps. For authentication and scheduled updates, [paid plans](https://evidence.dev/cloud) are available.

</Details>

<Details title="How do I get onto a Team or Enterprise plan?">

Email us: [archie@evidence.dev](mailto:archie@evidence.dev), or reach out on Evidence Cloud chat. 
</Details>


### Account Management

<Details title="How do I add a new developer to my Evidence app?">

Give them access to your [Github repository](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/managing-an-individuals-access-to-an-organization-repository). All Evidence Cloud plans come with unlimited developer accounts.

</Details>

<Details title="Which git providers can I use with Evidence Cloud?">

We support GitHub by default. If your team needs another git provider, reach out on [Slack](https://slack.evidence.dev).

</Details>

### Troubleshooting

<Details title="I've successfully deployed the template app. How do I edit it?">

Clone the git repository to your local machine (the repo URL is shown in the cloud UI), make edits to the code and/or database settings, and merge the edits to your target branch.

</Details>


<Details title="How long do builds take?">

Most builds will be completed in under 2 minutes, and you can track progress in the build logs. The initial deployment may take longer as we provision your account.

</Details>


<Details title="When can I expect build failures?">

Evidence will not deploy sites with errors to prevent users from seeing broken reports. Usually, this is caused by an error with your code.  Enter `npm run build` in your editor to test if the build succeeds locally. If you are still having issues, reach out on [Slack](https://slack.evidence.dev).

</Details>

<Details title="How can I prevent queries or components with errors from making it to my site?">

As a default, a failed chart or query will not throw an error. To prevent failed charts or queries from building successfully, edit the build command in `package.json` to `"build": "evidence build:strict"`.

</Details>