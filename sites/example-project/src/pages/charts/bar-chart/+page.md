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


```sql missing_values
select 50 as sales, '1. Manufacturing' as category, 'Monday' as day, 1 as day_num 
union all
select 100, '1. Manufacturing', 'Tuesday', 2 as day_num 
union all
select 150, '1. Manufacturing', 'Wednesday', 3 as day_num 
union all
select 200, '1. Manufacturing', 'Thursday', 4 as day_num 
union all
select 200, '1. Manufacturing', 'Friday', 5 as day_num 
union all
select 300, '1. Manufacturing', 'Saturday', 6 as day_num 
union all
select 10, '2. Retail', 'Monday', 1 as day_num 
union all
select 20, '2. Retail', 'Tuesday', 2 as day_num 
union all
select 31, '2. Retail', 'Wednesday', 3 as day_num 
union all
select 41, '2. Retail', 'Thursday', 4 as day_num 
union all
select 60, '2. Retail', 'Saturday', 6 as day_num 
union all
select 70, '2. Retail', 'Sunday', 7 as day_num  
union all
select 320, '3. Healthcare', 'Wednesday', 3 as day_num 
union all
select 420, '3. Healthcare', 'Thursday', 4 as day_num 
union all
select 520, '3. Healthcare', 'Friday', 5 as day_num 
union all
select 620, '3. Healthcare', 'Saturday', 6 as day_num 
union all
select 720, '3. Healthcare', 'Sunday', 7 as day_num 
order by day_num
```

<BarChart 
    data={missing_values} 
    x=day 
    y=sales 
    series=category
    sort=false
    seriesSort=category
    --seriesSortOrder=desc
/>



## Stacked Bar with Custom Series Sort

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
    labels=true
    seriesSort=sales_usd0k
    seriesSortOrder=desc
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
