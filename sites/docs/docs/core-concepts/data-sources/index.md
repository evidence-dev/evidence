---
sidebar_position: 2
title: Data Sources
description: Connect a data source in order to run queries.
---

Evidence supports connecting to a database, or local data files.

## Connect your data

To connect your local development environment to a database:

1. Run your evidence project with `npm run dev`
1. Navigate to [localhost:3000/settings](http://localhost:3000/settings)
1. Select your database and enter your credentials

Evidence will save your credentials locally, and run a test query to confirm that it can connect.

### Supported data sources

Evidence supports:

- [BigQuery](/guides/bigquery)
- Snowflake
- Redshift
- PostgreSQL
- MySQL
- SQLite
- DuckDB
- [CSV files](#local-data-files)
- & More

We're adding new connectors regularly. [Create a GitHub issue](https://github.com/evidence-dev/evidence/issues) or [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q) if you'd like to use Evidence with a database that isn't currently supported.

## Local Data Files

In Evidence, you can query local CSV files directly in SQL.

Get started by selecting the `CSV` connector on the Settings page in your project.

### How to Query a CSV File

#### Inside your Evidence Project

Evidence looks for CSV files stored in a `sources` folder in the root of your Evidence project. You can then query them using this syntax:

```sql
select * from 'sources/myfile.csv'
```

#### Absolute Filepaths

You can pass in an absolute filepath:

```sql
select * from 'Users/myname/Downloads/myfile.csv'
```

#### Relative Filepaths

Paths are **relative to two files deep** in your Evidence project. For example, to query a CSV in the root of an Evidence project, you would use this syntax:

```sql
select * from '../../myfile.csv'
```

### SQL Syntax for Querying CSVs

Evidence uses DuckDB to run SQL against a CSVs. For query syntax, see the [DuckDB docs](https://duckdb.org/docs/sql/query_syntax/select).

### Parsing Headers

When parsing headers in CSV files, the `read_csv_auto` helper function provided by DuckDB can be helpful.

```sql
select * from read_csv_auto('source/myfile.csv', HEADER=TRUE);
```

In addition to the `HEADER` argument, this function can also accept changes to the delimiter (`DELIM`), quotes (`QUOTE`), and more.

Additional information about CSV helper functions can be found in the [DuckDB docs](https://duckdb.org/docs/data/csv).

## SSL with PostgreSQL

To connect to a Postgres database using SSL, you may need to modify the SSL settings used. Once you have selected a PostgreSQL data connection type, you can set the SSL value as follows:
 - false: Don't connect using SSL (default)
 - true: Connect using SSL, validating the SSL certificates. Self-signed certificates will fail using this approach.
 - no-verify: Connect using SSL, but don't validate the certificates.

Other SSL options will require the use of a custom connection string. Evidence uses the node-postgres package to manage these connections, and the details of additional SSL options via the connection string can be found at the [package documentation](https://node-postgres.com/features/ssl).

One scenario might be a Postgres platform that issues a self-signed certificate for the database connection, but provides a CA certificate to validate that self-signed certificate. In this scenario you could use a CONNECTION STRING value as follows: `postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=require&sslrootcert=/path/to/file/ca-certificate.crt`. Replace the various `{properties}` as needed, and replace `/path/to/file/ca-certificate.crt` with the path and filename of your certificate.

## Troubleshooting

If you need help with connecting to your data, please feel free to [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q).
