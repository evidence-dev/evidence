---
title: Link Button
description: Style a link as a button.
sidebar_position: 1
---

Use the link button component to style a link as a button.

<DocTab>
    <div slot='preview'>
      <LinkButton url='/components/ui/link-button'>
        My Link Button
      </LinkButton>
    </div>

```markdown
<LinkButton url='/components/ui/link-button'>
  My Link Button
</LinkButton>
```
</DocTab>

## Options


<PropListing name="url" required options='string'>

Renders a button that, when clicked, navigates to the specified URL. It can accept either a full external link (e.g. `https://google.com`) or link to another page within your evidence app (e.g. `/sales/performance`).
</PropListing>