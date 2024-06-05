---
title: Grid
sidebar_position: 1
queries: 
- orders_by_month.sql
- orders_by_category_2021.sql
- orders_by_item_all_time.sql
- categories_by_channel.sql
---

<Grid cols=2>
    <BarChart title="Bar Chart" data={orders_by_category_2021} x=month y=sales series=category/>
    <LineChart title="Line Chart" data={orders_by_category_2021} x=month y=sales series=category/>
    <ScatterPlot title="Scatter Plot" data={orders_by_category_2021} x=month y=sales series=category/>
    <BubbleChart title="Bubble Chart" data={orders_by_category_2021} x=month y=sales series=category size=sales/>
</Grid>


```svelte
<Grid cols=2>
    <BarChart title="Bar Chart" data={orders_by_category_2021} x=month y=sales series=category/>
    <LineChart title="Line Chart" data={orders_by_category_2021} x=month y=sales series=category/>
    <ScatterPlot title="Scatter Plot" data={orders_by_category_2021} x=month y=sales series=category/>
    <BubbleChart title="Bubble Chart" data={orders_by_category_2021} x=month y=sales series=category size=sales/>
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