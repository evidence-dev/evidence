WITH inserted as (
  SELECT
    '2024-06-01 17:00:00+00'::timestamptz as "timestamptz_utc_offset",
    '2024-06-01 12:00:00-05'::timestamptz as "timestamptz_local_offset",
    '2024-06-01 17:00:00'::timestamp as "timestamp"
)

SELECT * FROM inserted

-- SELECT
--   "timestamptz_utc_offset",
--   "timestamptz_local_offset",
--   "timestamp" AT TIME ZONE 'America/Chicago' as "at_time_zone"
-- FROM inserted
