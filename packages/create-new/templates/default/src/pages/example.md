# Austin 311 Calls

```summary
    select
        count(*) as total_calls,
        countif(timestamp_diff(current_timestamp(), created_date, day) <7) as calls_in_the_last_7_days,
        countif(timestamp_diff(current_timestamp(), created_date, day) <365) as calls_in_the_last_365_days,
        min(created_date) as earliest_call_date,
        max(created_date) as latest_call_date
    from `bigquery-public-data.austin_311.311_service_requests`
    limit 9581
```

Austin 311 has fielded <Value data={data.summary}/> calls since <Value data={data.summary} column=earliest_call_date/>. The team has fielded <Value data={data.summary} column=calls_in_the_last_365_days/> calls over the last 365 days.

```daily_compaints
    select
        extract(date from created_date) as date,
        count(*) as number_of_complaints
    from `bigquery-public-data.austin_311.311_service_requests`
    group by 1
    order by 1 desc
    limit 365
```

<LineChart data={data.daily_compaints} x='date' y='number_of_complaints' units="calls per day"/>

Call data is updated every few days -- the most recent update was on <Value data={data.summary} column=latest_call_date/>.

```daily_complaints_by_category
    select
        complaint_description as description,
        extract(date from created_date) as date,
        count(*) as number_of_complaints
    from `bigquery-public-data.austin_311.311_service_requests`
    group by 1,2
```

# Top {data.top_complaint.length} Call Categories

The following {data.top_complaint.length} categories have generated the most calls since 2014.

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
        limit 3
    )

    select *,
    number_of_complaints/total.complaints as complaints_pct
    from top_complaints
    left join total on true
```

{#each data.top_complaint as complaint}

### {complaint.description}

Generated <Value value={complaint.number_of_complaints}/> calls since 2014, <Value value={complaint.complaints_pct} fmt="pct"/> of all calls.

<LineChart data={data.daily_complaints_by_category.filter(d => d.description === complaint.description)} x="date" y="number_of_complaints" units={complaint.description + " Calls"}/>

{/each}

# Volume Spikes

The following volume spikes may warrant further investigation.

Spikes are defined as days where more than 50 calls were placed for a category _and_ the number of calls was five or more standard deviations away from average.

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

select * from spikes
limit 5
```

Now that we've given people some context, we use a loop to generate a section for each of the most recent spikes in call volume.

```daily_complaints_by_category
    select
        complaint_description as description,
        extract(date from created_date) as date,
        count(*) as number_of_complaints
    from `bigquery-public-data.austin_311.311_service_requests`
    where created_date >= timestamp_sub(current_timestamp(), interval 180 day)
    group by 1,2
```

{#each data.spikes as spike}

## {spike.description}

{spike.number_of_complaints} calls on <Value value={spike.date} fmt="date"/>

<LineChart data={data.daily_complaints_by_category.filter(d => d.description === spike.description)} x="date" y="number_of_complaints" units={spike.description + " Calls"}/>

{/each}
