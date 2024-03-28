---
title: Fullscreen
sidebar_position: 1
---

<img src="/img/fullscreen.png" alt="Image of the fullscreen component in use" width="600"/>

```markdown
<Fullscreen bind:open={isOpen}>
	<BarChart
		data={items}
		x=item
		y=sales
	/>
</Fullscreen>
```

The `Fullscren` component allows you to easily create a fullscreen modal. This is useful for displaying charts or other content in a larger format. In the above example, the `BarChart` component is displayed in a fullscreen modal when the `isOpen` variable is set to `true`.

## Options

| Name       | Description | Required? | Options | Default|
| ---------- | ----------- | --------- |---------| -------|
| open       | Whether or not the component is open. For most use cases, this should be a binding attached to a button or similar input. | Yes | -| false
