---
title: Last Refreshed
sidebar_position: 1
---

Displays the last time the data was refreshed. This component is useful for showing users how up-to-date the data is.

<LastRefreshed/>

```markdown
<LastRefreshed/>
```

## Examples

### Alternative Prefix

<LastRefreshed prefix="Data last updated"/>

```markdown
<LastRefreshed prefix="Data last updated"/>
```

## Options

<PropListing
    name=prefix
    description="Text to display before the last refreshed time"
    options=string
    defaultValue="Last refreshed"
/>