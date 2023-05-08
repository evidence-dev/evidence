# BigQuery Dates

```sql dates
select
    CAST('2022-07-21' AS DATE) as date,
    CAST('2022-07-21 11:21:24' AS DATETIME) as datetime,
    CAST('2022-07-21 11:21:24Z' AS TIMESTAMP) as timestamp,
    CAST('11:21:24' AS TIME) as time
```

{console.log(dates)}

```sql fff
select '11:10' as time, 100 as value
union all
select '11:11' as time, 105 as value
union all
select '11:12' as time, 110 as value
union all
select '11:13' as time, 113 as value
union all
select '11:14' as time, 122 as value
```

<LineChart
    data={fff}
/>
