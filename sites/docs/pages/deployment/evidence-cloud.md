---
sidebar_position: 2
hide_table_of_contents: false
title: Evidence Cloud
---

## What is Evidence Cloud?

Evidence Cloud is our new hosting service that allows you to securely host Evidence projects.

It's the easiest way to host an Evidence project, without having to worry about maintaining your own infrastructure.

### Key Features

- **Easy to set up:** Deploy in 5 minutes without configuring any infrastructure.
- **Secure:** Manage access for users in your team.
- **Organizational domain:** Host your project at `[organisation].evidence.app`.
- **Scheduled refreshes:** Daily (or more frequent) data updates to your project.
- **Re-build on push:** Merge to your target branch to rebuild your project.

## Request Invite

Evidence Cloud is currently invite-only, request one below.

<LinkButton url="https://du3tapwtcbi.typeform.com/to/kwp7ZD3q?utm_source=docs"> Request Invite </LinkButton>

<br/>
<br/>

## How do I set up Evidence Cloud

Setting up Evidence Cloud takes less than 5 minutes.

1. Go to [evidence.app](https://evidence.app) and sign in with GitHub
1. Choose an option to get started:
   1. **If you have an existing project:** click `Deploy Evidence Project`
   1. **If you don't have a project yet**, select `Create New Project from Template`, then return to [evidence.app](https://evidence.app) after creating your template project in GitHub
1. Enter your deployment details, including the GitHub repo you want to use, and the domain you want to deploy it to
1. Add your credentials, either from your local project or from the template
1. Click `Deploy your project`


## Frequently Asked Questions

### Features


<Details title="What causes my data to update?">

- Pushes to your target branch.
- Clicking the `Redeploy` button in the UI.
- You can also set up a regularly scheduled refresh.

</Details>

<Details title="How frequently does Evidence Cloud refresh my data?">
You can set up data refreshes as regularly as you need.
</Details>

<Details title="How do I get more frequent data refreshes?">

Email us: [archie@evidence.dev](mailto:archie@evidence.dev), or reach out on 
Evidence Cloud chat.
</Details>

<Details title="How does authentication work for my deployed project?">

    Each viewer account is provided with a unique login to access the project. You can manage viewers in the Evidence Cloud UI.
</Details>

<Details title="How can I create a public Evidence Cloud site?">

    If you want your Evidence Cloud project URL to be accessible to anyone, deploy your site, and reach out on Evidence Cloud chat. We will verify your identity before making the site public.
</Details>

<Details title="How do I set up development previews?">

Alongside your `main` branch, set up a secondary project targeting a development branch (e.g. `dev`) whenever you merge changes into `dev`, you will get a preview. When you are ready to release changes, merge these into `main`.

You can set up different database credentials for development deployments, which allows 
you to use development data before it is in your production db.

</Details>



### Pricing

<Details title="Is Evidence Cloud free?">

Evidence Cloud's Free tier offers up to 5 viewer accounts, and up to one connected repository. Beyond this, you can upgrade to a [paid plan](https://evidence.dev/cloud).

</Details>

<Details title="How do I get onto a Team or Embedded plan?">

Email us: [archie@evidence.dev](mailto:archie@evidence.dev), or reach out on Evidence Cloud chat. 
</Details>


### Account Management

<Details title="How do I add a new developer to my Evidence project?">

Give them access to your [Github repository](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/managing-an-individuals-access-to-an-organization-repository). All Evidence Cloud plans come with unlimited developer accounts.

</Details>

<Details title="Which git providers can I use with Evidence Cloud?">

Currently we support GitHub by default. If your team needs another git provider, reach out on [Slack](https://slack.evidence.dev).

</Details>

### Troubleshooting

<Details title="I've successfully deployed the template project. How do I edit it?">

Clone the git repository to your local machine (the repo URL is shown in the cloud UI), make edits to the code and/or database settings, and merge the edits to your target branch.

</Details>


<Details title="How long do builds take?">

Most builds will be completed in under 2 minutes, and you can track progress in the build logs. The initial deployment may take longer as we provision your account.

</Details>


<Details title="When can I expect build failures?">

Evidence will not deploy sites with errors to prevent users from seeing broken reports. Usually, this is caused by an error with your project code.  Enter `npm run build` in your editor to test if the build succeeds locally. If you are still having issues, reach out on [Slack](https://slack.evidence.dev).

</Details>

<Details title="How can I prevent queries or components with errors from making it to my site?">

As a default, a failed chart or query will not throw an error. To prevent failed charts or queries from building successfully, edit the build command in `package.json` to `"build": "evidence build:strict"`.

</Details>