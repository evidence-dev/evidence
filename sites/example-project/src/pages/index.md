# Home

<button class="save-pdf" onClick="print()">Download PDF</button>

<style>
    .save-pdf {
        background-color:navy; 
        color: white; 
        border-radius: 10px; 
        border-width: 0; 
        padding: 4px 10px 4px 10px;
    }

    .save-pdf:hover {
        filter: brightness(150%);
        cursor: pointer;
    }

    .save-pdf:active {
  -webkit-box-shadow: inset 0px 0px 5px black;
     -moz-box-shadow: inset 0px 0px 5px black;
          box-shadow: inset 0px 0px 5px black;
   outline: none;
    }
</style>

## Context

```summary
    select 
        count(*) as total_calls,
        countif(timestamp_diff(current_timestamp(), created_date, day) <7) as calls_in_the_last_7_days,
        countif(timestamp_diff(current_timestamp(), created_date, day) <365) as calls_in_the_last_365_days,
        min(created_date) as earliest_call_date, 
        max(created_date) as latest_call_date,
        "string1" as string1,
    from `bigquery-public-data.austin_311.311_service_requests` 
    limit 1 
```

Austin 311 has fielded <Value data={data.summary}/> calls since <Value data={data.summary} column=earliest_call_date/> and <Value data={data.summary} column=calls_in_the_last_365_days/> calls over the last 365 days.

<LineChart data={data.daily_complaints} x='date' y='number_of_complaints' units="calls to Austin 311 per day"/>

```daily_complaints
    select 
        extract(date from created_date) as date, 
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1 
    order by 1 desc
    limit 365
```

```monthly_complaints
    select date_trunc(date, month) as month,
    sum(number_of_complaints) as complaints
    from ${daily_complaints}
    group by month
    order by month asc
```

```annual_complaints
    select date_trunc(month, year) as year,
    sum(complaints) as complaints
    from ${monthly_complaints}
    group by year
```


<LineChart data={data.monthly_complaints}/>

Call data is updated every few days -- the most recent update was on <Value data={data.summary} column=latest_call_date/>. 

## Top {data.top_complaint.length} Call Categories 
The following {data.top_complaint.length} categories have generated the most calls since 2014:

```top_complaint 
    with total as (
        select 
            count(*) as complaints 
        from `bigquery-public-data.austin_311.311_service_requests` 
    ), 
    top_complaints as (
        select 
            complaint_description as description, 
            count(*) as number_of_complaints
        from `bigquery-public-data.austin_311.311_service_requests` 
        group by 1
        order by 2 desc 
        limit 4
    )

    select *,
    number_of_complaints/total.complaints as complaints_pct  
    from top_complaints 
    left join total on true
```

<ol>
{#each data.top_complaint as complaint}

<li> {complaint.description}: <Value value={complaint.number_of_complaints}/> calls (<Value value={complaint.complaints_pct} fmt="pct"/> of all calls)</li>

{/each}
</ol>

```top_categories_weekly
with     

top_complaints as (
    select 
        complaint_description as description, 
        count(*) as number_of_complaints
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1
    order by 2 desc 
    limit 16
)

select 
    date_trunc(created_date, week) as date, 
    complaint_description as description,
    count(*) as number_of_complaints 
from `bigquery-public-data.austin_311.311_service_requests` 
where complaint_description in (select description from  top_complaints)
and extract(year from created_date) >= extract(year from current_date()) - 2
group by 1,2
```

<LineChart title="Weekly Call Volume, by Category" data={data.top_categories_weekly} x=date y=number_of_complaints series=description/>

# Call volume is {data.ytd_volume[0].growth_pct >= 0 ? "up" : "down" } <Value data={data.ytd_volume} /> year to date

The team has fielded <Value data = {data.ytd_volume} column=vol /> so far this year, representing a <Value data={data.ytd_volume} /> {data.ytd_volume[0].growth_pct >= 0 ? "increase" : "decrease" } from the <Value data = {data.ytd_volume} column=vol row=1/> calls they had fielded by this point last year.
 
``` ytd_volume 
with annual_call_volume as (
    select 
        extract(year from created_date) as year,
        count(*) as vol
    from `bigquery-public-data.austin_311.311_service_requests`
    where extract(dayofyear from created_date) <= extract(dayofyear from current_date())
    and extract(year from created_date) >= extract(year from current_date()) - 3 
    group by 1 
)

select 
    safe_divide(vol, lag(vol) over(order by year)) - 1 as growth_pct,
    *   
from annual_call_volume
order by year desc

```

<LineChart data={data.daily_volume_yoy} x=day_of_year y=cum_vol series=year 
yAxisTitle="cumulative calls" 
xAxisTitle="day of year"/>

<LineChart data={data.daily_vol_yoy} x=day_of_year y=cum_vol series=year 
yAxisTitle="cumulative calls" 
xAxisTitle="day of year"/>


```daily_vol
 select 
        extract(year from created_date) as year,
        extract(dayofyear from created_date) as day_of_year,
        count(*) as vol
    from `bigquery-public-data.austin_311.311_service_requests`
    where extract(year from created_date) >= extract(year from current_date()) - 2 
    group by 1,2
```


```daily_vol_yoy
    select 
        *, 
        sum(vol) over(partition by year order by day_of_year) as cum_vol
    from ${daily_vol}
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

## <Value data={data.department_pareto} column=cutoff_pct/> of the growth came from {data.department_pareto.length} departments

``` department_pareto
with annual_call_volume as (
    select 
        extract(year from created_date) as year,
        owning_department as dept, 
        count(*) as vol
    from `bigquery-public-data.austin_311.311_service_requests`
    where extract(dayofyear from created_date) <= extract(dayofyear from current_date())
    group by 1,2 
), 
delta as (
    select 
        *, 
        vol - lag(vol) over(partition by dept order by year) as delta_vol, 
    from annual_call_volume
    order by year desc
),
share as (
    select 
        *,
        sum(delta_vol) over(partition by year) as total_delta,
        safe_divide(delta_vol, sum(delta_vol) over(partition by year)) as delta_share_pct,
    from delta 
),
cumulative as (
    select 
        *, 
        sum(delta_share_pct) over(partition by year order by delta_share_pct desc) as cum_sum
    from share 
)

select *, 
max(cum_sum) over() as cutoff_pct 
from cumulative 
where year = extract(year from current_date())
and cum_sum < 0.85
order by 4 desc
```

Year to date call volume is up by <Value data={data.department_pareto} column = total_delta/>. Of that growth, <Value data={data.department_pareto} column=cutoff_pct/> came from the following {data.department_pareto.length} departments:

<ol>
{#each data.department_pareto as item}
<li> <a href={`departments/${item.dept}`}> {item.dept}</a> +<Value value={item.delta_vol}/> calls (<Value value={item.delta_share_pct} fmt=pct/>) </li>
{/each}
</ol>

# Recent Call Volume Spikes  
The following [volume spikes](spikes) may warrant further investigation.

```spikes
    with daily_complaints_by_category as (
        select 
            complaint_description as description,
            extract(date from created_date) as date, 
            count(*) as number_of_complaints 
        from `bigquery-public-data.austin_311.311_service_requests` 
        group by 1,2 
    ), 
    rolling_metrics as (
        select *,
            stddev_pop(number_of_complaints) over(partition by description order by date rows between 365 preceding and 1 preceding) as rolling_stddev_daily_complaints,
            avg(number_of_complaints) over(partition by description order by date rows between 365 preceding and 1 preceding) as rolling_avg_daily_complaints
        from daily_complaints_by_category 
    ), 
    spikes as (
        select *,
        from rolling_metrics
        where 
        number_of_complaints > rolling_avg_daily_complaints + 5*rolling_stddev_daily_complaints
        and number_of_complaints > 50
        order by date desc
    )

    select * ,
    row_number() over() as spike_id,
    from spikes
    limit 3
```

```daily_complaints_by_category 
    select 
        complaint_description as description,
        extract(date from created_date) as date, 
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    where created_date >= timestamp_sub(current_timestamp(), interval 180 day)
    group by 1,2 
```

```complaints_by_dept_2019
select owning_department as dept,
count(*) as complaints
from `bigquery-public-data.austin_311.311_service_requests` 
where extract(year from created_date) = 2019
group by dept
```

```complaints_by_dept_2020
select owning_department as dept,
count(*) as complaints
from `bigquery-public-data.austin_311.311_service_requests` 
where extract(year from created_date) = 2020
group by dept
```

```complaints_join
select a.*, b.complaints as complaints_20 from ${complaints_by_dept_2019} a
left join ${complaints_by_dept_2020} b
on a.dept = b.dept
```


{#each data.spikes as spike}

## {spike.description}
[{spike.number_of_complaints} calls on <Value value={spike.date} fmt="date"/> &rarr;](/spikes/{spike.spike_id}) 

<LineChart data={data.daily_complaints_by_category.filter(d => d.description === spike.description)} x="date" y="number_of_complaints" units={spike.description + " Calls"}/>

{/each}
