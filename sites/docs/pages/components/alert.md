---
title: Alert
sidebar_position: 1
---

<Alert status=info>
This is an informational alert
</Alert>


```markdown
<Alert status=info>
This is an informational alert
</Alert>
```


## Examples

### Custom Colors

<Alert>
This is a default alert
</Alert>

<Alert status=info>
This is an informational alert
</Alert>

<Alert status=success>
This is a successful alert
</Alert>

<Alert status=warning>
This is a warning alert
</Alert>

<Alert status=danger>
This is a dangerous alert
</Alert>


```markdown
<Alert>
This is a default alert
</Alert>

<Alert status=info>
This is an informational alert
</Alert>

<Alert status=success>
This is a successful alert
</Alert>

<Alert status=warning>
This is a warning alert
</Alert>

<Alert status=danger>
This is a dangerous alert
</Alert>
```

### Alerts with Markdown

<Alert status=info>

This is an `<Alert>` component with _markdown support_.

Notice the empty line after the component if you want to use markdown.
</Alert>

```markdown
<Alert>

This is an `<Alert>` component with markdown support.

Notice the empty line after the component if you want to use markdown.
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