---
sidebar_position: 3
title: Authentication
---

## Roles

There are three permission levels users can have with Evidence Cloud: [Admin](#admin), [Developer](#developer), and [Viewer](#viewer).

```sql user_types
select 'Admin' as user_type, 'Manage Evidence App deployment via the Cloud Console' as description, 'GitHub' as authentication, '#admin' as link union all
select 'Developer', 'Develop an Evidence App', 'N/A: Use their own IDE', '#developer' union all
select 'Viewer', 'View a published Evidence App', 'SSO, Email / Password, Public', '#viewer'
order by user_type
```

<DataTable data={user_types} link=link />

<Alert status=warning>

_Note: These do not correspond to roles in any databases you connect to._
</Alert>

## Admin

Admins for an organization can manage all Evidence Apps within that organization.

### Permissions

There is currently no public API for these actions - they must be triggered via the Evidence Cloud Console.

<PropListing name="Create App">

Create new Evidence Apps
</PropListing>
<PropListing name="View Builds">

View the status of Evidence Apps builds
</PropListing>
<PropListing name="Redeploy">

Redeploy an Evidence App from the UI
</PropListing>
<PropListing name="Edit Credentials">

Edit the environment variables used for an app
</PropListing>
<PropListing name="Edit Schedule">

Adjust data refresh schedules
</PropListing>
<PropListing name="Add Admin">

Add an existing Evidence Cloud user as an admin for the organization 
- The user must have already logged in to Evidence Cloud at least once)
- You must invite the user with an email associated with their GitHub account
- The user must accept the invitation in the Evidence Cloud Console to join the team

</PropListing>
<PropListing name="Remove Admin">

Remove admin users from the organization
</PropListing>
<PropListing name="Invite Viewer">

Invite new [viewer](#viewer) users to an app (if using email/password)
</PropListing>
<PropListing name="Remove Viewer">

Delete [viewer](#viewer) users from an app (if using email/password)
</PropListing>

<br>




### Auth Providers

<PropListing name="GitHub">

To login to the Evidence Cloud Console, you need a GitHub account.
</PropListing>

## Developer

Developers can edit the source code for an Evidence App. 

This is not technically a role in Evidence Cloud, but rather a role in GitHub, where the Evidence App source code is stored.

### Permissions

<PropListing name="Edit Code">

Developers can edit the source code for an Evidence App in their own IDE
</PropListing>
<PropListing name="Push Code">

Push changes to the source code for an Evidence App, triggering a build
</PropListing>


### Auth Providers

<PropListing name="N/A">

Developers do not log in to Evidence Cloud, they use their own IDE to edit the source code for an Evidence App.
</PropListing>

## Viewer

Viewers can view a published Evidence App.

### Permissions

<PropListing name="View App">

Log in and view a published Evidence App
</PropListing>

### Auth Providers

Evidence supports email/password, public and SSO auth (via SAML / OIDC).

<PropListing name="Email / Password">

- If you choose email/password authentication, viewers log in with these credentials
- [Admins](#admin) manage viewers for an app via the Evidence Cloud Console

</PropListing>
<PropListing name="Microsoft Entra ID">

Formerly Azure Active Directory [Request integration guide](#request-integration-guide)
</PropListing>
<PropListing name="Google Workspace">

[Request integration guide](#request-integration-guide)
</PropListing>
<PropListing name="Okta">

[Request integration guide](#request-integration-guide)
</PropListing>
<PropListing name="Public (No auth)">

If you choose public authentication you do not use viewer roles, it is open to the public
</PropListing>



## Request Integration Guide

To request an integration guide for SSO with Microsoft Entra ID, Google Workspace, or Okta, please reach out to the team via [Slack](https://slack.evidence.dev) or [email](mailto:support@evidence.dev).