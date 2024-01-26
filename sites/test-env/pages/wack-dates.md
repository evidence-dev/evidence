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

```sql months
SELECT '2024-01-01' AS month, 100 AS value
UNION
SELECT '2023-12-01' AS month, 200 AS value
UNION
SELECT '2023-11-01' AS month, 3 AS value
```

<!-- The data returned from the query is still a string -->
{JSON.stringify(months, null, 2)}


<!-- But the datatable is coercing it to an (incorrect) date -->
<DataTable data={months}>
  <Column id=month />
</DataTable>

<DataTable data={months}>
  <Column id=month fmt="yyyy-mm-dd HH:MM:SS" />
</DataTable>
