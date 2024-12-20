---
sidebar_position: 4
hide_table_of_contents: false
title: Layouts
description: Customize the layout of your app by overwriting or modifying the default layout.
---

Customize the layout of your app by overwriting or modifying the default layout.

## Custom Layout 

Evidence will use any `+layout.svelte` file in the `/pages` directory to override the default layout.

<Alert status=info>
<b>Creating a Custom Layout</b>

The recommended approach is to copy and edit the default layout file. You can do this with the `Add Custom Layout` command in VS Code or with the CLI command below:

```bash
cp .evidence/template/src/pages/+layout.svelte pages
```

This file can also be found in the [Evidence GitHub repo](https://github.com/evidence-dev/evidence/blob/main/sites/example-project/src/pages/+layout.svelte).
</Alert>

You can customize the `EvidenceDefaultLayout` with the options below, or replace the contents of the file with an entirely new layout. If you include a `+layout.svelte` file in a directory, markdown files in that directory (and its subdirectories) will use this layout file instead of the default layout.

You can also add your own HTML elements to the default page layout.

## Examples

### Hide sidebar on all pages

```html
<EvidenceDefaultLayout {data} hideSidebar=true >
	<slot slot="content" />
</EvidenceDefaultLayout>
```

### Add a custom logo

With a logo file in  `./static/my-logo.png`.

```html
<EvidenceDefaultLayout {data} logo="/my-logo.png" >
	<slot slot="content" />
</EvidenceDefaultLayout>
```

If you want to use a different logo in light and dark mode, use the `lightLogo` and `darkLogo` props instead of `logo`.

## Options

The `EvidenceDefaultLayout` component includes a number of features on every page that can be removed or customized via props

### Page Settings


<PropListing
    name="title"
    options="Any string"
    defaultValue=""
>

App title that will replace the Evidence Logo.

</PropListing>
<PropListing
    name="logo"
    options="/logo.png"
    defaultValue=""
>

Link to an image which will replace the Evidence logo. This will also override any app title in the header. If the image is in your project's static directory, the link should be relative to the static directory.

</PropListing>
<PropListing
    name="lightLogo"
    options="/lightLogo.png"
    defaultValue=""
>

Link to an image which will replace the Evidence logo in light mode. This will also override any app title in the header. If the image is in your project's static directory, the link should be relative to the static directory.

</PropListing>
<PropListing
    name="darkLogo"
    options="/darkLogo.png"
    defaultValue=""
>

Link to an image which will replace the Evidence logo in dark mode. This will also override any app title in the header. If the image is in your project's static directory, the link should be relative to the static directory.

</PropListing>
<PropListing
    name="homePageName"
    options="Any string"
    defaultValue=Home
>

Name of the home page in the sidebar.

</PropListing>
<PropListing
    name="fullWidth"
    options={['true', 'false']}
    defaultValue=false
>

Sets the width of the app content to the full width of the screen.

</PropListing>
<PropListing
    name="maxWidth"
    options="Any number"
    defaultValue=""
>

Sets the width of the app content in pixels. The default layout is about 1,280 px wide.

</PropListing>

<PropListing
    name="builtWithEvidence"
    options={['true', 'false']}
    defaultValue=false
>

Display a subtle link to the Evidence website at the bottom of the sidebar.

</PropListing>

### Hide Elements

<PropListing
    name="neverShowQueries"
    options={['true', 'false']}
    defaultValue=false
>

Removes the option to show queries when the app is deployed. Has no effect in development.

</PropListing>
<PropListing
    name="hideSidebar"
    options={['true', 'false']}
    defaultValue=false
>

Hides the sidebar navigation

</PropListing>
<PropListing
    name="hideHeader"
    options={['true', 'false']}
    defaultValue=false
>

Hides the page header

</PropListing>
<PropListing
    name="hideBreadcrumbs"
    options={['true', 'false']}
    defaultValue=false
>

Hides the breadcrumbs which appear at the top of the page

</PropListing>
<PropListing
    name="hideTOC"
    options={['true', 'false']}
    defaultValue=false
>

Hides the table of contents (on-page links at top right of page)

</PropListing>

### Social Links & Search

<PropListing
    name="githubRepo"
    defaultValue='https://github.com/evidence-dev/evidence'
>

Link to a Github Repo which will appear in the header using the Github Logo

</PropListing>
<PropListing
    name="xProfile"
    defaultValue='https://twitter.com/evidence_dev'
>

Link to an X (Twitter) profile which will appear in the header using the X Logo

</PropListing>
<PropListing
    name="blueskyProfile"
    defaultValue='https://bsky.app/profile/evidence.dev'
>

Link to a Bluesky profile which will appear in the header using the Bluesky Logo
</PropListing>
<PropListing
    name="slackCommunity"
    defaultValue='https://slack.evidence.dev'
>

Link to a slack community which will appear in the header using the slack Logo

</PropListing>
<PropListing
    name="algolia"
    options="{`{{appId: 'xxx', apiKey: 'xxx', indexName: 'xxx'}}`}"
    defaultValue=""
>

Object containing Algolia docsearch credentials

</PropListing>
