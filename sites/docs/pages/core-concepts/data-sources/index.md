---
sidebar_position: 3
title: Data Sources
description: Connect a data source in order to run queries.
---

## Overview of Data Sources

Evidence extracts all data sources into a common storage format (called Parquet) to enable querying across multiple data sources using SQL.

- To query against your data sources, you first need to extract the data into Parquet, using `npm run sources`
- Supported sources including SQL databases, flat data files (CSV etc), and non-SQL data sources (e.g. APIs)

![Universal SQL Data Source Architecture](/img/usql-architecture.png)

More information about the architecture design can be found in [this article](https://evidence.dev/blog/why-we-built-usql).


## Connect your Data Sources 

To connect your local development environment to a database:

1. Run your evidence app with `npm run dev`
1. Navigate to [localhost:3000/settings](http://localhost:3000/settings)
1. Select your data source, name it, and enter required credentials
1. (If required) Open the `connections.yaml` file inside `/sources/[source_name]` and add any additional configuration options
1. (If required) Add [source queries](#configure-source-queries) 
1. Rerun sources with `npm run sources`

Evidence will save your credentials locally, and run a test query to confirm that it can connect.

Connections to databases in production are managed via [environment variables](/reference/cli#environment-variables)

Evidence supports:

- [BigQuery](/core-concepts/data-sources/bigquery)
- [Snowflake](/core-concepts/data-sources/snowflake)
- [Redshift](/core-concepts/data-sources/redshift)
- [PostgreSQL](/core-concepts/data-sources/postgres)
- [Timescale](/core-concepts/data-sources/postgres)
- [Trino](/core-concepts/data-sources/trino)
- [Microsoft SQL Server](/core-concepts/data-sources/mssql)
- [MySQL](/core-concepts/data-sources/mysql)
- [SQLite](/core-concepts/data-sources/sqlite)
- [DuckDB](/core-concepts/data-sources/duckdb)
- [MotherDuck](/core-concepts/data-sources/motherduck)
- [Databricks](/core-concepts/data-sources/databricks)
- [Cube](/core-concepts/data-sources/postgres#cube)
- [Google Sheets](/core-concepts/data-sources/google-sheets)
- [CSV](/core-concepts/data-sources/csv)
- [Parquet](/core-concepts/data-sources/csv)
- [JavaScript](/core-concepts/data-sources/javascript)
- & More

## Configure Source Queries

For SQL data sources, choose which data to extract by adding .sql files to the `/sources/[source_name]/` folder.

**N.B: These queries use the data source's native SQL dialect.**

```code
.-- sources/
   `-- my_source/
      |-- connection.yaml
      `-- my_source_query.sql
```

Each of these .sql files will create a table that can be queried in Evidence as `[my_source].[my_source_query]`.

<Alert status=info>

**Non-SQL data sources**

For non-SQL data sources, configuring the data extracted is achieved in other ways. Refer to the documentation for the specific data source for details.

</Alert>

## Run Sources

You can extract data from configured sources in Evidence using  `npm run sources`. Sources will also rerun automatically if you have the dev server running and you make changes to your source queries or source configuration.

### Working with Large Sources

In dev mode, if you have large sources which take a while to run, it can be helpful to only run the sources which have changed. There are a few ways to accomplish this:

- If your dev server is running, any changes you make to source queries will only re-run the queries which have changed
- Run a modified sources command to specify the source you want to run:
   - `npm run sources -- --changed` run only the sources with changed queries
   - `npm run sources -- --sources my_source` run `my_source` only
   - `npm run sources -- --sources my_source --queries query_one,query_two` run `my_source.query_one` and `my_source.query_two` only

### Increase Process Memory

If you are working with large data sources (~1M+ rows), your `npm run sources` process may run out of memory, with an error similar to this:

```code
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

One way to circumvent this is to increase the amount of memory allocated to the process. The below command increases the memory to 4GB (the number is measured in MB), but you can set it arbitrarily up to the RAM of your machine

#### Mac OS / Linux

```code
NODE_OPTIONS="--max-old-space-size=4096" npm run sources
```

#### Windows

```code
set NODE_OPTIONS=--max-old-space-size=4096 && npm run sources
```

### Build Time Variables

You can pass variables to your source queries at build time using environment variables of the format `EVIDENCE_VAR__variable_name=value`.

`.env`
```bash
EVIDENCE_VAR__client_id=123
```

Then in your **source queries**, you can access the variable using `${}` syntax:

```sql
select * from customers
where client_id = ${client_id}
```

This will interpolate the value of `client_id` into the query:

```sql
select * from customers
where client_id = 123
```

Note that these variables are only accessible in source queries, not in file queries or queries in markdown files.


## New Data Sources


We're adding new connectors regularly. [Create a GitHub issue](https://github.com/evidence-dev/evidence/issues) or [send us a message in Slack](https://slack.evidence.dev) if you'd like to use Evidence with a database that isn't currently supported.

The source code for Evidence's connectors is available [on GitHub](https://github.com/evidence-dev/evidence/tree/main/packages/datasources)

## Troubleshooting

If you need help with connecting to your data, please feel free to [send us a message in Slack](https://slack.evidence.dev).
