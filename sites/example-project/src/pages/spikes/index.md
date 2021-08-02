# Volume Spikes 
Spikes are unusual increases in daily call volume for a given category. 

Spikes are defined as days where: 

1. At least 50 calls were placed for a category, and; 
2. The number of calls was at least five standard deviations above the average daily call volume for the category. 

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

select 
*,
row_number() over() as spike_id,
format_date("%B, %Y", date) as month
from spikes
where date_diff(current_date(), date, year) <= 2

```
Details on each of the {data.spikes.length} spikes over the last 2 years are are linked below: 

```months
    select 
        format_date("%B, %Y", created_date) as fmt_month,
        date_trunc(created_date, month) as month
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1,2 
    order by 2 desc
    limit 24 
```


{#each data.months as month}

## {month.fmt_month}
{#if data.spikes.filter(d => d.month == month.fmt_month).length === 0}

No spikes

{:else}   
    <ol>
    {#each data.spikes.filter(d => d.month == month.fmt_month) as spike}
            <li>
            <a href={"spikes/"+spike.spike_id}> <Value value={spike.number_of_complaints}/> calls </a> for {spike.description}  on <Value value={spike.date} fmt=date/>  
            </li>
    {/each}
    </ol>
{/if}

{/each}