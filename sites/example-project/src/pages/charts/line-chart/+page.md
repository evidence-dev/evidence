---
title: Line Chart
sources:
  - orders_by_month: orders_by_month.sql
  - orders_by_category: orders_by_category.sql
---

```sql simpler_bar
select 'Canada' as country, 60 as value, 1990 as year
union all
select 'Canada' as country, 83 as value, 1991 as year
union all
select 'Canada' as country, 95 as value, 1992 as year
union all
select 'Canada' as country, 182 as value, 1993 as year
union all
select 'Canada' as country, 87 as value, 1994 as year
union all
select 'Canada' as country, 103 as value, 1995 as year
union all
select 'Canada' as country, 111 as value, 1996 as year
union all
select 'US' as country, 41 as value, 1990 as year
union all
select 'US' as country, 47 as value, 1991 as year
union all
select 'US' as country, 70 as value, 1992 as year
union all
select 'US' as country, 65 as value, 1993 as year
union all
select 'US' as country, 80 as value, 1994 as year
union all
select 'US' as country, 90 as value, 1995 as year
union all
select 'US' as country, 125 as value, 1996 as year
union all
select 'UK' as country, 61 as value, 1990 as year
union all
select 'UK' as country, 63 as value, 1991 as year
union all
select 'UK' as country, 68 as value, 1992 as year
union all
select 'UK' as country, 73 as value, 1993 as year
union all
select 'UK' as country, 80 as value, 1994 as year
union all
select 'UK' as country, 83 as value, 1995 as year
union all
select 'UK' as country, 85 as value, 1996 as year
union all
select 'China' as country, 30 as value, 1990 as year
union all
select 'China' as country, 33 as value, 1991 as year
union all
select 'China' as country, 40 as value, 1992 as year
union all
select 'China' as country, 52 as value, 1993 as year
union all
select 'China' as country, 65 as value, 1994 as year
union all
select 'China' as country, 78 as value, 1995 as year
union all
select 'China' as country, 101 as value, 1996 as year
```

```annotate2
select 0 as startval, 1000 as endval, 'Normal' as label, 'green' as color
union all
select 2200 as startval, 2500 as endval, 'Elevated' as label, 'yellow' as color
union all
select 4125 as startval, 5000 as endval, 'Emergency' as label, 'red' as color
```

```annotate
select '2020-12-05' as start_date, '2022-12-31' as end_date, 'Campaign A' as label
union all
select '2023-02-14' as start_date, '2023-03-20' as end_date, 'Campaign B' as label
union all
select '2023-04-14' as start_date, null as end_date, 'Campaign C' as label
```

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
    yFmt=eur
    xFmt='mmm d'
/>

## Multi-Series Line

<LineChart data={simpler_bar} x=year y=value series=country/>

## Muliple y Column Line

<LineChart data={orders_by_month} x=month y={["sales_usd0k","num_orders_num0"]}/>

## Multiple y Column and Series Line

<LineChart data={orders_by_category} x=month series=category y={["sales_usd0k","num_orders_num0"]}/>

## Multi-Series Line with Custom Height

<LineChart data={simpler_bar} x=year y=value series=country chartAreaHeight=380/>
