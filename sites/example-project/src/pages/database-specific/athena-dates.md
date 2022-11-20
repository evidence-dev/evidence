# Athena Dates

```dates
select 
    timestamp '2012-10-31 01:00 UTC' as timestamp,
    timestamp '2012-10-31 01:00 UTC' AT TIME ZONE 'America/Los_Angeles' as timestamptz,
    date '2012-08-08' + interval '2' day as date,
    time '01:00' + interval '3' hour as time
```

{console.log(dates)}