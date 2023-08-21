---
title: Tabs
sidebar_position: 31
---

<img src="/img/tabs.png" alt="tabs" width="600"/>

<hr/>

```markdown
<Tabs>
    <Tab label="First Tab">
        Content of the First Tab
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab
    </Tab>
</Tabs>
```

## Props

### Tabs Props

| Name | Description                                                                                           | Required | Default |
| ---- | ----------------------------------------------------------------------------------------------------- | -------- | ------- |
| id   | Unique Id for this set of tabs. When set, the selected tab is included in the URL so it can be shared | No       | -       |
| color | Color for the active tab. Can be any valid hex, rgb, or hsl string.                                  | No       | -       |

### `Tab` Props

| Name  | Description                                                                                           | Required | Default |
| ----- | ----------------------------------------------------------------------------------------------------- | -------- | ------- |
| label | Label for the tab                                                                                     | Yes      | -       |
| id    | Unique Id for this tab. Should only be needed if 2 tabs have the same label, which isn't recommended. | No       | {label} |
