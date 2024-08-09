# Timezones

## Overview

<Flowchart 
    chart='graph LR
    A("`**Data Sources**
    Any TZ`") --"Source 
    Queries"--> B
    B("`**Unified 
    Data Cache**
    UTC`") --"Markdown 
    Queries"--> C
    C("`**Component 
    Display**
    Configured`")'
/>

- Source queries should return data in UTC ([How?](#returning-data-in-utc))
- Configure the display timezone in `evidence.plugins.yaml` (default  is UTC)
- One display timezone is used for the whole project, and it is used for all viewers, irrespective of local timezones.

## Why are Timezones Important?

If you fail to consider timezone when working with data, you can end up with the following puzzling situations:
- Times shown in your app are offset by a number of hours
- The date displayed is one day off from what you expected
- Aggregating and grouping by time periods gives incorrect aggregate values

Correctly handling timezones is essential to avoid these kind of problems.

There are 4 contexts for timezones in Evidence.
- [Data Sources](#data-source-timezones) - Timezones stored explicitly or implicitly in databases containing columns with date and time information.
- [Unified Data Cache](#unified-data-cache) - The timezone used in the data cache (always UTC).
- [Markdown Queries](#markdown-queries) - The timezone used by the Evidence SQL engine (default UTC, configurable).
- [Component Display](#component-display) - The timezone used when displaying data on the page (default UTC, configurable).

## Data Source Timezones

Most, but not all Evidence data sources have native date and time data types that support timezones.

```sql timezone_support
select 'BigQuery' as source, 'Yes' as timezone_support union all
select 'Snowflake', 'Yes' union all
select 'Redshift', 'Yes' union all
select 'PostgreSQL', 'Yes' union all
select 'Timescale', 'Yes' union all
select 'Trino', 'Yes' union all
select 'Microsoft SQL Server', 'Yes' union all
select 'MySQL', 'Yes' union all
select 'SQLite', 'Yes' union all
select 'DuckDB', 'Yes' union all
select 'MotherDuck', 'Yes' union all
select 'Databricks', 'Yes' union all
select 'Cube', '?' union all
select 'Google Sheets', '-' union all
select 'CSV', '-' union all
select 'Parquet', '-'
order by 1
```
<DataTable data={timezone_support} compact rows=all/>


## Unified Data Cache

Data in the Unified Data Cache should be stored in UTC.

Evidence extracts data from all your sources, and caches it in the unified data cache. This cache is a set of Parquet files (stored in `.evidence/template/static/data`).

Parquet is an ideal choice for a cache for a data app because it is a highly compressed, columnar storage format and it can be queried directly by DuckDB, which powers the Evidence SQL engine.

Parquet stores date and time information using the TIMESTAMP type, which does support timezones, so you should store all your data in the cache in UTC, to avoid timezone issues using Evidence.

Specifically, [TIMESTAMP in Parquet](https://github.com/apache/parquet-format/blob/master/LogicalTypes.md#timestamp) stores an integer number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).

### Time-like Data Types

Databases typically store time-like data in two ways:
- Timestamp with timezone: Stored **with** an explicit timezone like `2024-06-27 02:00:00 +02`
- Timestamp without timezone: Stored **without** an explicit timezone like `2024-06-27 02:00:00`

Evidence will automatically store timestamps with timezone as UTC.

For timestamps without timezone, Evidence will assume they are UTC, unless you specify otherwise.

### Returning Data in UTC

If you have **timestamps without timezones**, you should convert them to UTC in your source queries. The syntax for this varies.

Assume you have the column `created_at_berlin`, a timestamp without timezone in your database: e.g. `2024-06-27 02:00:00`, which is in Berlin time.

```sql syntax_for_utc_conversion
select 'BigQuery' as source, '<code class=markdown>timestamp(datetime(created_at_berlin), ''Europe/Berlin'')</code>' as conversion_syntax union all
select 'Snowflake', '<code class=markdown>convert_timezone(''Europe/Berlin'', ''UTC'', created_at_berlin )</code>'
union all
select 'PostgreSQL', '<code class=markdown>created_at_berlin at time zone ''Europe/Berlin''</code>'
union all
select 'DuckDB', '<code class=markdown>created_at_berlin at time zone ''Europe/Berlin''</code>'
```

Consult the documentation for your database to find the appropriate syntax for your source.

<DataTable data={syntax_for_utc_conversion} rows=all>
    <Column id=source/>
    <Column id=conversion_syntax contentType=html/>
</DataTable>

To inspect the data in your cache to see whether it is correctly in UTC, install a Parquet viewing tool like [Parquet Viewer](https://marketplace.visualstudio.com/items?itemName=dvirtz.parquet-viewer), navigate to the `.evidence/template/static/data` directory, and open the `.parquet` files. 

You may find it helpful to use an epoch time converter like [Epoch Converter](https://marketplace.visualstudio.com/items?itemName=makhan.epoch-converter), which can be configured to show human readable times when you hover over epoch timestamps.

## Markdown Queries

Evidence's SQL Engine is powered by DuckDB, which by default uses the UTC timezone for date and time aggregations.

The SQL engine uses the timezone specified in `evidence.plugins.yaml` for time related functions, e.g.

```yaml
timezone: America/New_York
```

Timezone support is powered by [ICU extension](https://duckdb.org/docs/sql/functions/timestamptz.html) in DuckDB, which provides a range of functions for working with timezones.


## Component Display

Components will display data in the timezone specified in `evidence.plugins.yaml`.

You set this globally for the project, which means that all viewers will see the data in the same timezone, irrespective of their local timezone.

### Set the Display Timezone

`evidence.plugins.yaml`

```yaml
timezone: America/New_York
```