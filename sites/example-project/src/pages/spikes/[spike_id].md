# <Value value = {spike[0].date} fmt=date/> -- {spike[0].description} Spike

There were {spike[0].number_of_complaints} calls for {spike[0].description} on <Value value = {spike[0].date} fmt=date/>
<LineChart data={daily_complaints_by_category.filter(d => d.description === spike[0].description)} x="date" y="number_of_complaints" yAxisTitle={spike[0].description + " Calls"}/>

Call volume was <Value value={spike[0].number_of_complaints/spike[0].rolling_stddev_daily_complaints}/> standard deviations above the rolling 365 day average of <Value value={spike[0].rolling_avg_daily_complaints}/> calls.

<Histogram data={daily_complaints_by_category_filtered} x=number_of_complaints xAxisTitle="Calls per day, last 365 days" units="days"/>

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
        select *
        from rolling_metrics
        where 
        number_of_complaints > rolling_avg_daily_complaints + 5*rolling_stddev_daily_complaints
        and number_of_complaints > 50
        order by date desc
    )

    select * ,
    row_number() over() as spike_id,
    from spikes where date_diff(current_date(), date, year) <= 2
```

```daily_complaints_by_category 
    select 
        complaint_description as description,
        extract(date from created_date) as date, 
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    where created_date >= timestamp_sub(current_timestamp(), interval 365 day)
    group by 1,2 
```

<script>
    let spike = data.spikes.filter(d => d.spike_id == $page.params.spike_id)
    let daily_complaints_by_category_filtered = data.daily_complaints_by_category.filter(d => d.description === spike[0].description);
</script>
