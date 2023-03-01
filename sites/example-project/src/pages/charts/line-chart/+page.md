```fda_recalls
SELECT date_trunc(recall_initiation_date, year) as year, 
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year
```

```fda_recalls_class
SELECT date_trunc(recall_initiation_date, year) as year, classification, 
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year, classification
```

```daily_complaints
    select 
        extract(date from created_date) as date, 
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1 
    order by 1 desc
    limit 150
```

```daily_volume_yoy
with daily_vol as (
        select 
        extract(year from created_date) as year,
        extract(dayofyear from created_date) as day_of_year,
        count(*) as vol
    from `bigquery-public-data.austin_311.311_service_requests`
    where extract(year from created_date) >= extract(year from current_date()) - 2 
    group by 1,2)

select 
    *, 
    sum(vol) over(partition by year order by day_of_year) as cum_vol
from daily_vol
```

```simpler_bar
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

## Line
<LineChart 
    data={daily_complaints} 
    x=date 
    y=number_of_complaints 
    yAxisTitle="calls to Austin 311 per day"
/>

## Multi-Series Line
<LineChart data={simpler_bar} x=year y=value series=country/>

## Muliple y Column Line
<LineChart data={fda_recalls} x=year y={['voluntary_recalls', 'fda_recalls']}/>

## Multiple y Column and Series Line
<LineChart data={fda_recalls_class} x=year series=classification y={['voluntary_recalls', 'fda_recalls']}/>
