# Date Formatting and Performance

### This shoudn't take forever

```whole_lotta_dates
SELECT * FROM range('1990-01-01'::DATE, '4747-11-29'::DATE, interval '1' day)
```

<DataTable data={whole_lotta_dates} />

### These columns should match

```try_to_break_dates
SELECT
	'1970-01-01' as str_date, '1970-01-01'::DATE as reg_date
UNION ALL SELECT
	'2020-01-01' as str_date, '2020-01-01'::DATE as reg_date
UNION ALL SELECT
	'2020-01-01' as str_date, '2020-01-01 00:00:00'::TIMESTAMP as reg_date
UNION ALL SELECT
	'2020-01-01' as str_date, '2020-01-01 23:59:59'::TIMESTAMP as reg_date
UNION ALL SELECT
	'2020-02-29' as str_date, '2020-02-29'::DATE as reg_date
UNION ALL SELECT
	'2020-02-29' as str_date, '2020-02-29 00:00:00'::TIMESTAMP as reg_date
UNION ALL SELECT
	'2020-02-29' as str_date, '2020-02-29 23:59:59'::TIMESTAMP as reg_date
```

<DataTable data={try_to_break_dates} rows={Infinity} />
