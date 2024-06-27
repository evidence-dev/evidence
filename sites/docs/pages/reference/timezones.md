# Timezones

## TLDR

- Your source queries should return data in UTC
- You can configure the timezone in which data is displayed by setting the timezone field in `evidence.plugins.yaml` (default UTC)
- Only one display timezone can be set for the whole project, and it is used for all viewers, irrespective of their local timezone

## Why are Timezones Important?

If you fail to consider timezone when working with data, you can end up with the following puzzling situations:
- Times shown in your app are offset by a number of hours
- The date displayed is one day off from what you expected
- Aggregating and grouping by time periods gives incorrect aggregate values

Correctly handling timezones is essential to avoid this.

There are 4 contexts for timezones in Evidence.
- [Database Timezones](#database-timezone-support) - Timezones stored explicitly or implicitly in databases containing columns with date and time information.
- [Unified Data Cache Timezones](#unified-data-cache) - The timezone used in the data cache (always UTC).
- [SQL Engine Timezone](#sql-engine) - The timezone used by the Evidence SQL engine (default UTC, configurable).
- [Viewer Timezone](#viewer) - The timezone used when displaying data on the page (default UTC, configurable).

## Database Timezone Support

Most, but not all Evidence data sources have native date and time data types that support timezones.

```sql timezone_support
select 'BigQuery' as source, 'Yes' as timezone_support union all,
select 'Snowflake', 'Yes' union all,
select 'Redshift', 'Yes' union all,
select 'PostgreSQL', 'Yes' union all,
select 'Timescale', 'Yes' union all,
select 'Trino', 'Yes' union all,
select 'Microsoft SQL Server', 'Yes' union all,
select 'MySQL', 'Yes' union all,
select 'SQLite', 'Yes' union all,
select 'DuckDB', 'Yes' union all,
select 'MotherDuck', 'Yes' union all,
select 'Databricks', 'Yes' union all,
select 'Cube', '?' union all,
select 'Google Sheets', 'No' union all,
select 'CSV', 'No' union all,
select 'Parquet', 'No'
```


## Unified Data Cache

Evidence extracts data from all your sources, and caches it in the unified data cache. This cache is a set of Parquet files (stored in `.evidence/template/static/data`).

Parquet is an ideal choice for a cache for a data app because it is a highly compressed, columnar storage format and it can be queried directly by DuckDB, which powers the Evidence SQL engine.

Parquet stores date and time information using the TIMESTAMP type, which does support timezones, so you should store all your data in the cache in UTC, to avoid timezone issues using Evidence.

Specifically, [TIMESTAMP in Parquet](https://github.com/apache/parquet-format/blob/master/LogicalTypes.md#timestamp) stores an integer number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).

To inspect the data in your cache to see whether it is correctly in UTC, install a Parquet viewing tool like [Parquet Viewer](https://marketplace.visualstudio.com/items?itemName=dvirtz.parquet-viewer), navigate to the `.evidence/template/static/data` directory, and open the `.parquet` files. 

You may find it helpful to use an epoch time converter like [Epoch Converter](https://marketplace.visualstudio.com/items?itemName=makhan.epoch-converter), which can be configured to show human readable times when you hover over epoch timestamps.

## SQL Engine

Evidence's SQL Engine is powered by DuckDB, which by default uses the UTC timezone for date and time aggregations.

However, the [ICU extension](https://duckdb.org/docs/sql/functions/timestamptz.html) is available in DuckDB, which provides a range of functions for working with timezones.

With Evidence, you can configure the timezone used by the SQL engine in DuckDB by setting the timezone field in ?? evidence.plugins.yaml

This timezone will be used when you run use time related functions in your SQL queries.

### Example

#### UTC

`date_trunc('day', timestamptz '2022-01-01 12:00:00+00')` returns `2022-01-01 00:00:00+00`

#### America/New_York

`date_trunc('day', timestamptz '2022-01-01 12:00:00+00')` returns `2022-01-01 05:00:00+00`

```code
timezone: America/New_York
```

```sql timezones
from pg_timezone_names()
```

<Details title="Full list of timezones">

<DataTable data={timezones} compact/>

</Details>

## Viewer Timezone

The viewer timezone is also configured using the timezone field in  `evidence.plugins.yaml`. This sets the timezone used when displaying data on the page.

You set this globally for the project, which means that all viewers will see the data in the same timezone, irrespective of their local timezone.