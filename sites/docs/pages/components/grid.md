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
    name="cols"
    options={['1', '2', '3', '4', '5', '6']}
    defaultValue="2"
>

Number of columns in the grid on a full size screen

</PropListing>
<PropListing 
    name="gapSize"
    options={['none', 'sm', 'md', 'lg']}
    defaultValue="md"
>

Space between grid elements

</PropListing>