---
title: Alert
sidebar_position: 30
---

![alert](/img/alerts.png)

```markdown
<Alert>
This is a default alert
</Alert>

<Alert status="info">
This is a informational alert
</Alert>

<Alert status="success">
This is a successful alert
</Alert>

<Alert status="warning">
This is a warning alert
</Alert>

<Alert status="danger">
This is a dangerous alert
</Alert>
```

## Props

| Name   | Description                         | Required | options                                       | Default   |
| ------ | ----------------------------------- | -------- | --------------------------------------------- | --------- |
| status | Changes the colors of the alert     | No       | `default` `info` `success` `warning` `danger` | `default` |
| sticky | Makes the alert always stay in view | No       |                                               | false     |
