---
title: Last Refreshed
sidebar_position: 1
---

Displays the last time the data was refreshed. This component is useful for showing users how up-to-date the data is.

<DocTab>
    <div slot='preview'>
        <LastRefreshed/>
    </div>

```markdown
<LastRefreshed/>
```
</DocTab>

## Examples

### Alternative Prefix

<DocTab>
    <div slot='preview'>
        <LastRefreshed prefix="Data last updated"/>
    </div>

```markdown
<LastRefreshed prefix="Data last updated"/>
```
</DocTab>

## Options

<PropListing
    name=prefix
    description="Text to display before the last refreshed time"
    options=string
    defaultValue="Last refreshed"
/>