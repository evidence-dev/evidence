---
title: Bar Chart
queries:
  - orders_by_month: orders_by_month.sql
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
echartsOptions={{
    textStyle: {
        fontFamily: "Inter"
    }
}}
>

    <ReferenceLine y=34234 label="Sales Target" hideValue=false/>

</BarChart>

## Stacked Bar

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
    labels=true
    echartsOptions={{
    textStyle: {
        fontFamily: "Inter"
    }
}}
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

## Multiple y Axes

<BarChart data={orders_by_month} x=month y=sales_usd0k y2=num_orders_num0 y2SeriesType=bar y2Fmt=eur />

## Multiple y Axes with Line

<BarChart data={orders_by_month} x=month y=sales_usd0k y2=num_orders_num0 y2SeriesType=line y2Labels=true colorPalette={['rgb(110,117,176,0.8)','rgb(37,91,161)']} labels=true/>

# Value Labels

## Stacked Bar with Labels

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
    labels=true
/>

## Stacked Bar with Labels - Total turned off

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
    labels=true
    stackTotalLabel=false
/>


## Single Bar with Labels
<BarChart 
    data={items_all_time}
    x=item
    y=sales_usd0k
    swapXY=true 
    sort=true
    labels=true
/>

## Bar with Log Scale

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
    type=grouped
    yLog=true
/>

## Very Long Bar

```characters_ep_total
SELECT * FROM csv.characters_ep_total
```

<BarChart 
    data={characters_ep_total} 
    x=character_name 
    y={['best_of_episodes','non_best_of_episodes']}
    swapXY=true
/>
