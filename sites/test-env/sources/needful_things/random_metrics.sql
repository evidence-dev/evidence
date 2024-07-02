WITH underlying_data AS (
  SELECT * FROM (
    SELECT 
      "range" as hourly,
      setseed(0) as noop,
      random() as metric
      FROM 
        range(
          DATE_TRUNC('hour', '2024-06-01 00:00:00'::timestamp AT TIME ZONE 'America/Chicago')::timestamp - INTERVAL 2 days, -- from
          DATE_TRUNC('hour', '2024-06-01 00:00:00'::timestamp AT TIME ZONE 'America/Chicago')::timestamp, -- to
          INTERVAL 1 hour -- space
        )
  )
)


SELECT
  DATE_TRUNC('day', hourly) AT TIME ZONE 'America/Chicago' as daily1,
  DATE_TRUNC('day', hourly) AT TIME ZONE 'America/Chicago' as daily2,
  AVG(metric) as avg_metric
FROM underlying_data
GROUP BY ALL
ORDER BY daily1

