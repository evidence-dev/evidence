---
title: Link
description: Add an inline link into your markdown
sidebar_position: 1
---

<Alert status=info>

    Note that you can also use [markdown syntax for links](/reference/markdown#links). This component is useful when you need to customize the behavior or styling of the link (e.g., opening in new tab vs. current tab)
</Alert>

Use the `Link` component to add styled and accessible links to your markdown pages. This component allows you to control the destination URL, link text, and whether it opens in a new tab.

## Default usage

<DocTab>
<div slot='preview'>
    <Link 
        url="https://github.com/evidence-dev/evidence"
        label="Visit Example"
    />
</div>

```markdown
<Link 
    url="https://github.com/evidence-dev/evidence"
    label="Visit Example"
/>
```
</DocTab>

### Open in a new tab

<DocTab>
<div slot='preview'>
    <Link 
        url="https://github.com/evidence-dev/evidence"
        label="Visit Example"
        newTab=true
    />
</div>

```markdown
<Link 
    url="https://github.com/evidence-dev/evidence"
    label="Visit Example"
    newTab=true
/>
```
</DocTab>

## Options

<PropListing 
    name="url"
    required={true}
    options="string"
>

The destination URL of the link. It can accept either a full external link (e.g. `https://google.com`) or link to another page within your evidence app (e.g. `/sales/performance`).
</PropListing>

<PropListing 
    name="label"
    defaultValue="Click here"
>
The text displayed for the link.
</PropListing>

<PropListing 
    name="newTab"
    defaultValue="false"
    options={['true', 'false']}
>
Whether the link should open in a new tab
</PropListing>

<PropListing 
    name="class"
>

Pass custom classes to style the link. Supports [Tailwind classes](https://tailwindcss.com).
</PropListing>
