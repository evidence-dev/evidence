---
sidebar_position: 2
title: Data Sources
description: Connect a data source in order to run queries.
---

## Connect to a Database

To connect your local development environment to a database:

1. Run your evidence project with `npm run dev`
1. Navigate to [localhost:3000/settings](http://localhost:3000/settings)
1. Select your database and enter your credentials

Evidence will save your credentials locally, and run a test query to confirm that it can connect.

### Supported Databases

Evidence supports: 

- [BigQuery](#bigquery)
- Snowflake 
- Redshift
- PostgreSQL 
- MySQL 
- SQLite
- DuckDB
- [CSV files](#use-local-csvs) and parquet files
- & More

We're adding new connectors regularly. Feel free to [create a GitHub issue](https://github.com/evidence-dev/evidence/issues) or [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q) if you'd like to use Evidence with a database that isn't currently supported.

## Use Local CSVs

In Evidence, you can query local CSV files directly in SQL.

Get started by selecting the `CSV` connector on the Settings page in your project.

### How to Query a CSV File

#### Inside your Evidence Project

We recommend setting up a `sources` folder in the root of your Evidence project to store CSV files. You can then query them using this syntax:

```sql
select * from 'sources/myfile.csv'
```

You can also use the CSV connector to connect to parquet files.

```sql
select * from 'sources/myfile.parquet'
```

#### Anywhere on your Filesystem

You can also pass in an absolute filepath:

```sql
select * from 'Users/myname/Downloads/myfile.csv'
```

:::info Relative Filepaths
Please note that using a relative filepath from inside your Evidence project won't work as expected.

If you must do this, prepend `../../` to your relative path - this will bring you to the root of your Evidence project, and the rest of your relative path should work as expected.

:::

### SQL Syntax for Querying CSVs
Evidence uses DuckDB to run SQL against a CSV file. 

[See the DuckDB docs for information on query syntax](https://duckdb.org/docs/sql/query_syntax/select)

### Issues with Headers
If you run into problems getting your query to recognize the headers in your CSV file, you can use the `read_csv_auto` helper function provided by DuckDB. For example:
```sql
select * from read_csv_auto('source/myfile.csv', HEADER=TRUE);
```

In addition to the `HEADER` argument, this function can also accept changes to the delimeter (`DELIM`), quotes (`QUOTE`), and more. 

[Additional information about CSV helper functions can be found in DuckDB's docs here.](https://duckdb.org/docs/data/csv)

--- 

## BigQuery

Evidence supports connecting to Google BigQuery by using a [service account](https://cloud.google.com/iam/docs/service-accounts) and a JSON key. 

Follow the instructions below to set up your service account and get a JSON key. 

### Create a Service Account Key

1. [Go to the Service Account Page](https://console.cloud.google.com/projectselector/iam-admin/serviceaccounts/create?supportedpurview=project&_ga=2.202527640.867747861.1622513856-469265758.1621868166&_gac=1.81391205.1622124503.CjwKCAjw47eFBhA9EiwAy8kzNKaExCvM0G229wH0PGh4USFcdB7wudKCKWt4MSEPM6wbQKCwOot1NxoCtxIQAvD_BwE) and click on your project
2. Add a name for your service account, then click Create
3. Assign your service account a role for BigQuery (scroll down the role dropdown to find BigQuery roles). **BigQuery User** should work, but it may depend on your organization's permissions settings in Google Cloud. If you run into trouble with permissions, you may need to change this role. Reach out to us if you run into issues or need help with BigQuery permissions.
4. Click Continue, then click Done. You should see a table of users.
5. Click on the email address for the service account you just created, then click the **Keys** tab
6. Click Add Key, then Create New Key, then Create
7. Google will download a JSON Key File to your computer

## Troubleshooting

If you need help with connecting to your data, please feel free to [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q). 
