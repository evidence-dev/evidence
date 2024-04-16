---
title: Grid
sidebar_position: 1
---

```markdown
<Grid cols=2>
    <!-- 2x2 grid of barcharts -->
    <BarChart ... />
    <BarChart ... />
    <BarChart ... />
    <BarChart ... />
</Grid>
```

## Options

<PropListing
    name=cols
    description="Number of columns in the grid on a full size screen"
    options={['1', '2', '3', '4', '5', '6']}
    defaultValue="2"
/>
<PropListing
    name=gapSize
    description="Space between grid elements"
    options={['none', 'sm', 'md', 'lg']}
    defaultValue="md"
/>