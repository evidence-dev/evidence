---
title: Alert
description: Display a message in a styled container on the page.
sidebar_position: 1
---

Use alerts to display a message in a styled container on the page.

<DocTab>
    <div slot='preview'>
<Alert>
This is a default alert
</Alert>

<Alert status="info">
This is a informational alert
</Alert>

<Alert status="positive">
This is a positive alert
</Alert>

<Alert status="warning">
This is a warning alert
</Alert>

<Alert status="negative">
This is a negative alert
</Alert>
    </div>

```markdown
<Alert>
This is a default alert
</Alert>

<Alert status="info">
This is a informational alert
</Alert>

<Alert status="positive">
This is a positive alert
</Alert>

<Alert status="warning">
This is a warning alert
</Alert>

<Alert status="negative">
This is a negative alert
</Alert>
```
</DocTab>

## Options

<PropListing
    name="status"  
    options={['info', 'positive', 'warning', 'negative']}
>

Changes the color of the alert

</PropListing>
<PropListing
    name=description
    options="string"
>

Adds an info icon with description tooltip on hover

</PropListing>
