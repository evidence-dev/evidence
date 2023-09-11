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

## Get Early Access

Evidence Cloud is currently in private beta. To get early access, sign up below.

<a class="waitlist" href="https://du3tapwtcbi.typeform.com/to/kwp7ZD3q?utm_source=docs">Get Early Access</a>

## How do I set up Evidence Cloud

1. Evidence Cloud is invite-only: If you haven't already, [request access](https://du3tapwtcbi.typeform.com/to/kwp7ZD3q?utm_source=docs)
1. Go to [evidence.app](https://evidence.app) and sign in with GitHub
1. If you have an existing project, click Deploy Evidence Project, if you don't yet, select Create New Project from Template, then return to [evidence.app](https://evidence.app) after creating your template project in GitHub
1. Enter your deployment details, including the GitHub repo you want to use, and the domain you want to deploy it to
1. Add your credentials, either from your local project or from the template
1. Click `Deploy your project`


## Frequently Asked Questions

### Troubleshooting

<details>
    <summary>Where is my credentials file?</summary>
    <ul>
    <li><b>If you are deploying the default template:</b> You don't need them, hit the button to use the template project default credentials.</li>
    <li><b>If you have an existing project:</b> Your credentials file is stored in <code>.evidence/template/evidence.settings.json</code>. You may need to edit your file explorer settings (<a href="https://support.microsoft.com/en-us/windows/view-hidden-files-and-folders-in-windows-97fbc472-c603-9d90-91d0-1166d1d9f4b5">windows</a>, <a href="https://discussions.apple.com/thread/7581737">mac</a>) to show hidden folders .</li>
    </ul>
</details>

<details>
    <summary>Why did my build fail?</summary>
    <p>Usually this is caused by an error with your project code. Evidence will not deploy sites with errors to prevent users from seeing broken reports. Enter <code>npm run build</code> in your editor to test if the build succeeds locally. If you are still having issues, reach out on Slack.</p>
</details>

<details>
    <summary>Why is my project taking a long time to build?</summary>
    <p>The initial deployment takes longer as we provision your account, and may take up to 15 minutes. Subsequent builds will be much faster and will show detailed build logs as they progress.</p>
</details>



<details>
    <summary>How can I set up development previews?</summary>
    <p>Alongside your <code>main</code> branch, set up a secondary project targeting a development branch (e.g. <code>dev</code>) whenever you merge changes into <code>dev</code>, you will get a preview. When you are ready to release changes, merge these into <code>main</code>.</p>
    <p>You can set up different database credentials for development deployments, which allows you to use development data before it is in your production db.</p>
</details>


### Pricing

<details>
    <summary>Is Evidence Cloud free?</summary>
    <p>Evidence Cloud is free for up to 5 viewer accounts, and up to one connected repository. Beyond this, you'll need to upgrade to one of the <a href="https://evidence.dev/cloud">paid plans</a>).</p>
</details>

<details>
    <summary>How do I upgrade to the Team or Enterprise plans?</summary>
    <p>Email <a href="mailto:archie@evidence.dev">archie@evidence.dev</a>, including your login (GitHub username) and the plan you want to upgrade to.</p>
</details>




## Account Management

<details>
    <summary>How do I add a new viewer account to my project?</summary>
    <p>Log in to Evidence Cloud at <a href="https://evidence.app">evidence.app</a>, and select your project. Click on the <code>Users</code> tab, and enter the email address of the user you want to add. They will receive an email with login details.</p>
</details>

<details>
    <summary>How do I add a new developer to my Evidence project?</summary>
    <p>Give them access them to your <a href="https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/managing-an-individuals-access-to-an-organization-repository">github repository</a>. Only one user can manage the Evidence Cloud deployment settings at this time.</p>
</details>


<details>
    <summary>How do I delete a project?</summary>
    <p>Email <a href="mailto:archie@evidence.dev">archie@evidence.dev</a>, and ask.</p>
</details>

<details>
    <summary>How do I get more frequent data refreshes?</summary>
    <p>Email <a href="mailto:archie@evidence.dev">archie@evidence.dev</a>, and ask.</p>
</details>

<details>
    <summary>How do I log out?</summary>
    <p>Click on the icon showing your GitHub avatar in the top right and select <code>Sign out</code>.</p>
</details>

<details>
    <summary>Can I use Evidence Cloud with GitLab / BitBucket / another git provider?</summary>
    <p>Not yet! If your team needs another git provider, reach out on Slack.</p>
</details>