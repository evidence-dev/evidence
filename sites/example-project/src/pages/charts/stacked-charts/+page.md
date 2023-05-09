# 100% Stacked Charts

```sql simpler_bar_unordered
select 'Canada' as country, 87 as value, 1994 as year
union all
select 'Canada' as country, 83 as value, 1991 as year
union all
select 'Canada' as country, 95 as value, 1992 as year
union all
select 'Canada' as country, 182 as value, 1993 as year
union all
select 'Canada' as country, 60 as value, 1990 as year
union all
select 'Canada' as country, 103 as value, 1995 as year
union all
select 'Canada' as country, 111 as value, 1996 as year
union all
select 'US' as country, 41 as value, 1990 as year
union all
select 'US' as country, 47 as value, 1991 as year
union all
select 'US' as country, 125 as value, 1996 as year
union all
select 'US' as country, 65 as value, 1994 as year
union all
select 'US' as country, 80 as value, 1992 as year
union all
select 'US' as country, 90 as value, 1995 as year
union all
select 'US' as country, 70 as value, 1993 as year
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

## Examples

<BarChart data={data.simpler_bar_unordered} x=year y=value series=country type=stacked100/>

<BarChart swapXY=true xType=category data={data.simpler_bar_unordered} x=year y=value series=country type=stacked100 yAxisTitle=true/>

<AreaChart data={data.simpler_bar_unordered} x=year y=value series=country type=stacked100/>

## Issues

100% stacks do not work in composable charts:

<Chart data={simpler_bar_unordered} x=year y=value series=country >
    <Bar type=stacked100/>
</Chart>

Y-axis title gets cut off when 100% stack is used:
<BarChart xType=category data={data.simpler_bar_unordered} x=year y=value series=country type=stacked100 yAxisTitle=true/>

## Single Series Stack

```sql simpler_bar_oneyear
select 'Canada' as country, 87 as value, 1994 as year
union all
select 'US' as country, 65 as value, 1994 as year
union all
select 'UK' as country, 80 as value, 1994 as year
union all
select 'China' as country, 65 as value, 1994 as year

```

More we can do here to make a single series example publication-quality.

Ideas:

- Replace y-axis labels with data labels in the bar
- Remove whitespace on either side of bar
- Alternate legend placement (right or left)
- Remove x-axis label under bar

<BarChart 
    data={simpler_bar_oneyear} 
    x=year 
    y=value 
    series=country
    type=stacked100
    xAxisLabels=false
    yGridlines=false
/>
