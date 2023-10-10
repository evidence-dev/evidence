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
- **Organizational domain:** Host your project at `<organisation>.evidence.app`.
- **Scheduled refreshes:** Daily (or more frequent) data updates to your project.
- **Re-build on push:** Merge to your target branch to rebuild your project.

## Request Invite

Evidence Cloud is currently invite-only, request one below.

<a class="waitlist" href="https://du3tapwtcbi.typeform.com/to/kwp7ZD3q?utm_source=docs">Request Invite</a>

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


<details>
    <summary>What causes my data to update?</summary>
    <ul>
        <li>Pushes to your target branch.</li>
        <li>Clicking the <code>Redeploy</code> button in the UI.</li>
        <li>You can also set up a regularly scheduled refresh.</li>
    </ul>
</details>

<details>
    <summary>How frequently does Evidence Cloud refresh my data?</summary>
    <p>You can set up data refreshes as regularly as you need.</p>
</details>

<details>
    <summary>How do I get more frequent data refreshes?</summary>
    <p>Email us: <a href="mailto:archie@evidence.dev">archie@evidence.dev</a>, or reach out on Evidence Cloud chat..</p>
</details>

<details>
    <summary>How does authentication work for my deployed project?</summary>
    <p>Each viewer account is provided with a unique login to access the project. You can manage viewers in the Evidence Cloud UI.</p>
</details>

<details>
    <summary>How can I create a public Evidence Cloud site?</summary>
    If you want your Evidence Cloud project URL to be accessible to anyone, deploy your site, and reach out on Evidence Cloud chat. We will verify your identity before making the site public.
</details>

<details>
    <summary>How do I set up development previews?</summary>
    <p>Alongside your <code>main</code> branch, set up a secondary project targeting a development branch (e.g. <code>dev</code>) whenever you merge changes into <code>dev</code>, you will get a preview. When you are ready to release changes, merge these into <code>main</code>.</p>
    <p>You can set up different database credentials for development deployments, which allows you to use development data before it is in your production db.</p>
</details>



### Pricing

<details>
    <summary>Is Evidence Cloud free?</summary>
    <p>Evidence Cloud's Free tier offers up to 5 viewer accounts, and up to one connected repository. Beyond this, you can upgrade to a <a href="https://evidence.dev/cloud">paid plan</a>.</p>
</details>

<details>
    <summary>How do I get onto a Team or Enterprise plan?</summary>
    <p>Email us: <a href="mailto:archie@evidence.dev">archie@evidence.dev</a>, or reach out on Evidence Cloud chat.</p>
</details>



### Account Management

<details>
    <summary>How do I add a new developer to my Evidence project?</summary>
    <p>Give them access to your <a href="https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/managing-an-individuals-access-to-an-organization-repository">GitHub repository</a>. All Evidence Cloud plans come with unlimited developer accounts.</p>
</details>

<details>
    <summary>Which git providers can I use with Evidence Cloud?</summary>
    <p>Currently we support GitHub by default. If your team needs another git provider, reach out on <a href="https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q">Slack</a>.</p>
</details>

### Troubleshooting

<details>
    <summary>I've successfully deployed the template project. How do I edit it?</summary>
    <p>Clone the git repository to your local machine (the repo URL is shown in the cloud UI), make edits to the code and/or database settings, and merge the edits to your target branch.</p>
</details>


<details>
    <summary>How long do builds take?</summary>
    <p>Most builds will be completed in under 2 minutes, and you can track progress in the build logs. The initial deployment may take longer as we provision your account.</p>
</details>


<details>
    <summary>Where is my credentials file?</summary>
    <ul>
    <li><b>If you are deploying the default template:</b> You don't need them, hit the button to use the template project default credentials.</li>
    <li><b>If you have an existing project:</b> Your credentials file is stored in <code>.evidence/template/evidence.settings.json</code>. You may need to edit your file explorer settings (<a href="https://support.microsoft.com/en-us/windows/view-hidden-files-and-folders-in-windows-97fbc472-c603-9d90-91d0-1166d1d9f4b5">windows</a>, <a href="https://discussions.apple.com/thread/7581737">mac</a>) to show hidden folders.</li>
    </ul>
</details>

<details>
    <summary>When can I expect build failures?</summary>
    <p>Evidence will not deploy sites with errors to prevent users from seeing broken reports. Usually, this is caused by an error with your project code.  Enter <code>npm run build</code> in your editor to test if the build succeeds locally. If you are still having issues, reach out on <a href="https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q">Slack</a>.</p>
</details>

<details>
    <summary>How can I prevent queries or components with errors from making it to my site?</summary>
    <p>As a default, a failed chart or query will not throw an error. To prevent failed charts or queries from building successfully, edit the build command in <code>package.json</code> to <code>"build": "evidence build:strict"</code>.</p>
</details>