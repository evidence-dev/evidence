---
title: Big Link
description: Display a url link in a styled container.
sidebar_position: 1
---

Use big links to display a url link in a styled container. To style links like Buttons, use a [Link Button](/components/ui/link-button).

<DocTab>
    <div slot='preview'>
      <BigLink url='/components/ui/big-link'>My Big Link</BigLink> 
    </div>

```markdown
      <BigLink url='/components/ui/big-link'>My Big Link</BigLink> 
```
</DocTab>

## Options

<PropListing name="url" required options='string'>

Renders a link that, when clicked, navigates to the specified URL. It can accept either a full external link (e.g. `https://google.com`) or link to another page within your evidence app (e.g. `/sales/performance`).
</PropListing>
<PropListing name="href" options='string'>

href deprecated, please use url
</PropListing>
