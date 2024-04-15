---
title: Tabs
sidebar_position: 1
---


<Tabs>
    <Tab label="First Tab">
        Content of the First Tab

        You can use **markdown** here too!
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab

        Here's a [link](https://www.google.com)
    </Tab>
</Tabs>



```markdown
<Tabs>
    <Tab label="First Tab">
        Content of the First Tab

        You can use **markdown** here too!
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab

        Here's a [link](https://www.google.com)
    </Tab>
</Tabs>
```

## Examples

### Custom Color


<Tabs color=#ff0000>
    <Tab label="Red Tabs">
        Content of the First Tab
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab
    </Tab>
</Tabs>

```markdown
<Tabs color=#ff0000>
    <Tab label="Red Tabs">
        Content of the First Tab
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab
    </Tab>
</Tabs>
```

# Tabs

## Options

<PropListing
    name="id"
    description="Unique Id for this set of tabs. When set, the selected tab is included in the URL so it can be shared."
/>
<PropListing
    name="color"
    description="Color for the active tab."
    options="Any valid hex, rgb, or hsl string"
    defaultValue=blue
/>

# Tab

## Options

<PropListing
    name="label"
    description="Label for the tab"
    required
/>
<PropListing
    name="id"
    description="Unique Id for this tab. Only needed if 2 tabs have the same label (not recommended)."
/>
