---
title: Tabs
sidebar_position: 31
---

![tabs](/img/tabs.png)

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

### `Tab` Props

| Name  | Description                                                                                           | Required | Default |
| ----- | ----------------------------------------------------------------------------------------------------- | -------- | ------- |
| label | Label for the tab                                                                                     | Yes      | -       |
| id    | Unique Id for this tab. Should only be needed if 2 tabs have the same label, which isn't recommended. | No       | {label} |
