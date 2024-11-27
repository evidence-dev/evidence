---
sidebar_position: 2
hide_table_of_contents: false
title: Evidence Cloud
description: Evidence Cloud is the easiest way to host Evidence apps. It's maintained by the Evidence team, and allows you to securely host Evidence apps without having to worry about maintaining your own infrastructure.
og:
    image: /img/deployment/deploy-evidence-cloud.png
---

Evidence Cloud is the easiest way to host Evidence apps. It's maintained by the Evidence team, and allows you to securely host Evidence apps without having to worry about maintaining your own infrastructure.

- **Easy to set up:** Deploy in 5 minutes without configuring any infrastructure.
- **Secure:** Manage access for users in your team.
- **Organizational domain:** Host your app at `[organisation].evidence.app`.
- **Scheduled refreshes:** Daily (or more frequent) data updates to your app.
- **Re-build on push:** Merge to your target branch to rebuild your app.
- **Custom domains:** Add a custom domain to your app.
- **Cloud execution engine:** Offload heavy queries to our Cloud SQL engine for faster performance.

## Prerequisites

- A GitHub account
- An Evidence project pushed to GitHub (optional)

## Deploying your app

1. Go to [evidence.app](https://evidence.app) and login with GitHub
1. Choose an option to get started:
   1. **If you have an existing Evidence project:** click `Add Project`
   1. **If you don't have a Evidence project yet:** select `Start from our templates`, and choose evidence-dev/template.
1. Deploy your project
   - Repository: Choose the GitHub repository containing your Evidence project
   - Branch: Edit if required
   - Domain: Choose the subdomain you want to deploy to
   - (Optional) Root directory: Edit to point to your Evidence directory if you are using a monorepo
   - Authentication: None, Email and Password (Paid plans only), or SSO (Paid plans only)
1. Set your environment variables
   - **If you are deploying an existing project**, click "Paste Environment Variables", navigate to the [settings page](http://localhost:3000/settings#deploy) and use the **Copy All** button to copy them to your clipboard, then paste them into the Environment Variables section. Click **Save**.
   - **If you are deploying from a template**, click "Use Template Environment Variables"
1. Click `Deploy your project`

Your app will be deployed to https://[your-subdomain].evidence.app

## Domains, Authentication and Scheduling

### Authentication

Evidence Cloud Team and Enterprise plans support private apps with auth. If you need to configure an SSO provider, reach out to our team on [Slack](https://slack.evidence.dev).

### Custom Domains

Evidence Cloud Enterprise plans support custom domains. Reach out to our team on [Slack](https://slack.evidence.dev) to set your domain up.

### Data Refresh

To adjust your deployment schedule, select your app in [Evidence Cloud](https://evidence.app), click **Schedule**, and adjust the schedule.

Community Plan sites can be refreshed daily. More frequent refreshes are available on the Team and Enterprise plans.

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