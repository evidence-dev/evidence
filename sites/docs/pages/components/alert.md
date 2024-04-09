---
title: Alert
sidebar_position: 1
---

<img src="/img/alerts.png" alt="alert" width="600"/>

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

## Options

<PropListing
    name="status"
    description="Changes the colors of the alert"
    required="false"
    options={['default', 'info', 'success', 'warning', 'danger']}
    defaultValue="default"
/>