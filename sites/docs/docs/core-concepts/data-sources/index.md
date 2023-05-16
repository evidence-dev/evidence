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

Connections to databases in production are managed via [environment variables](/cli#environment-variables)

### Supported data sources

Evidence supports:

- [BigQuery](#bigquery)
- [Snowflake](#snowflake)
- [Redshift](#redshift)
- [PostgreSQL](#postgresql)
- [Microsoft SQL Server](mssql)
- [MySQL](#mysql)
- [SQLite](#sqlite)
- [DuckDB](#duckdb)
- [CSV and Parquet files](#local-data-files)
- & More

We're adding new connectors regularly. [Create a GitHub issue](https://github.com/evidence-dev/evidence/issues) or [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q) if you'd like to use Evidence with a database that isn't currently supported.

The source code for Evidence's connectors is available [on GitHub](https://github.com/evidence-dev/evidence/tree/main/packages)


## Data source specific info

All databases can be connected via the UI settings page as described above. Where relevant, additional information is provided below.

### BigQuery

Evidence supports connecting to Google BigQuery by using a [service account](https://cloud.google.com/iam/docs/service-accounts) and a JSON key.

OAuth is not currently supported (though PRs are welcome).

Follow the instructions below to set up your service account and get a JSON key.

#### Create a Service Account Key

1. [Go to the Service Account Page](https://console.cloud.google.com/projectselector/iam-admin/serviceaccounts/create?supportedpurview=project) and click on your project
2. Add a name for your service account, then click Create
3. Assign your service account a role for BigQuery (scroll down the role dropdown to find BigQuery roles).
   1. **BigQuery User** should work for most use cases.
   1. **BigQuery Data Viewer** may be required (depending on your organization's permissions settings in Google Cloud).
   1. Reach out to us if you run into issues or need help with BigQuery permissions.
4. Click Continue, then click Done. You should see a table of users.
5. Click on the email address for the service account you just created, then click the **Keys** tab
6. Click Add Key, then Create New Key, then Create
7. Google will download a JSON Key File to your computer



### Snowflake

Evidence supports connecting to Snowflake using [Basic Authentication](https://docs.snowflake.com/en/user-guide/api-authentication), i.e. username and password.

OAuth and Key-Pair authentication are not currently supported, though PRs are welcome.

### Redshift

The Redshift connector uses the Postgres connector under the hood, so configuration options are similar.
### PostgreSQL

#### SSL

To connect to a Postgres database using SSL, you may need to modify the SSL settings used. Once you have selected a PostgreSQL data connection type, you can set the SSL value as follows:
 - `false`: Don't connect using SSL (default)
 - `true`: Connect using SSL, validating the SSL certificates. Self-signed certificates will fail using this approach.
 - `no-verify`: Connect using SSL, but don't validate the certificates.

Other SSL options will require the use of a custom connection string. Evidence uses the node-postgres package to manage these connections, and the details of additional SSL options via the connection string can be found at the [package documentation](https://node-postgres.com/features/ssl).

One scenario might be a Postgres platform that issues a self-signed certificate for the database connection, but provides a CA certificate to validate that self-signed certificate. In this scenario you could use a CONNECTION STRING value as follows: 

```
postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=require&sslrootcert=/path/to/file/ca-certificate.crt
```

Replace the various `{properties}` as needed, and replace `/path/to/file/ca-certificate.crt` with the path and filename of your certificate.

### MySQL

#### SSL

SSL options are:

- `false` (default)
- `true`
- `Amazon RDS`
- A credentials object


### SQLite

SQLite is a local file-based database. It should be stored in the root of your Evidence project.

### DuckDB

DuckDB is a local file-based database. It should be stored in the root of your Evidence project.

See the [DuckDB docs](https://duckdb.org/docs/guides/index) for more information.

### CSV and Parquet files

In Evidence, you can query local CSV or Parquet files directly in SQL.

Get started by selecting the `CSV` connector on the Settings page in your project.

#### How to Query a CSV File

##### Inside your Evidence Project

Evidence looks for CSV files stored in a `sources` folder in the root of your Evidence project. You can then query them using this syntax:

```sql
select * from 'sources/myfile.csv'
```

##### Absolute Filepaths

You can pass in an absolute filepath:

```sql
select * from 'Users/myname/Downloads/myfile.csv'
```

##### Relative Filepaths

Paths are **relative to two files deep** in your Evidence project. For example, to query a CSV in the root of an Evidence project, you would use this syntax:

```sql
select * from '../../myfile.csv'
```

#### SQL Syntax for Querying CSVs

Evidence uses DuckDB to run SQL against a CSVs. For query syntax, see the [DuckDB docs](https://duckdb.org/docs/sql/query_syntax/select).

#### Parsing Headers

When parsing headers in CSV files, the `read_csv_auto` helper function provided by DuckDB can be helpful.

```sql
select * from read_csv_auto('source/myfile.csv', HEADER=TRUE);
```

In addition to the `HEADER` argument, this function can also accept changes to the delimiter (`DELIM`), quotes (`QUOTE`), and more.

Additional information about CSV helper functions can be found in the [DuckDB docs](https://duckdb.org/docs/data/csv).





## Troubleshooting

If you need help with connecting to your data, please feel free to [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q).
