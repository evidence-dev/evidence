---
title: Bar Chart
sources:
  - orders_by_category: orders_by_category.sql
  - orders_by_category_2021: orders_by_category_2021.sql
  - orders_by_item: orders_by_item.sql
  - items_all_time: orders_by_item_all_time.sql
  - marketing_spend: marketing_spend.sql
---

## Bar

<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
>

    <ReferenceLine y=34234 label="Sales Target" hideValue=false/>

</BarChart>

## Stacked Bar

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
/>

### Stacked Bar with Negative Values

<BarChart 
    data={marketing_spend}
    x=month_begin 
    y=spend
    series=marketing_channel
    yMin=-400
    yMax=10000
/>

## Grouped Bar

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category 
    type=grouped
/>

### Grouped Bar with Negative Values

<BarChart 
    data={marketing_spend}
    x=month_begin 
    y=spend
    series=marketing_channel
    type=grouped
/>

## Horizontal Bar

<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Country
swapXY=true
>

    <ReferenceLine y=66/>

</BarChart>

## Horizontal Stacked Bar

<BarChart 
    data={orders_by_category}
    swapXY=true
    x=month
    y=sales_usd0k
    series=category
    xType=category
    sort=false
/>

<BarChart 
    data={orders_by_category} 
    x=month 
    y=sales_usd0k 
    series=category 
    swapXY=true 
    xType=category
/>

## Horizontal Grouped Bar

<BarChart 
    data={orders_by_category} 
    swapXY=true 
    x=month
    y=sales_usd0k 
    series=category 
    type=grouped 
    xType=category
/>

## Long Bar Chart

<BarChart 
    data={items_all_time}
    x=item
    y=sales_usd0k
    swapXY=true 
    sort=true
/>

## Bar Chart with Custom Height

<BarChart 
    data={orders_by_category} 
    x=category 
    y=sales_usd0k 
    series=category
    xAxisTitle=Category
	chartAreaHeight=380
    title="Title"
    subtitle="Subtitle"
/>
