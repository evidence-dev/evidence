```date_ranges
with date_range as (
  select
     generate_series as start_timestamp,
     '2020-01-01'::date as stop_timestamp
  from
     generate_series(timestamp '2018-01-01', timestamp '2020-01-01', interval '2 year')
)
select
  unnest(generate_series(start_timestamp, stop_timestamp, interval '1 day')) as timestamp,
  random()
from
  date_range
```