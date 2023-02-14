---
sidebar_position: 3
title: Use Local CSVs
---

In Evidence, you can query local CSV files directly in SQL.

Get started by selecting the `CSV` connector on the Settings page in your project.

## How to Query a CSV File

### Inside your Evidence project
We recommend setting up a `sources` folder in the root of your Evidence project to store CSV files. You can then query them using this syntax:

```sql
select * from 'sources/myfile.csv'
```

### Anywhere on your local computer
You can also pass in an absolute filepath:
```sql
select * from 'Users/myname/Downloads/myfile.csv'
```

:::info Relative Filepaths
Please note that using a relative filepath from inside your Evidence project won't work as expected.

If you must do this, prepend `../../` to your relative path - this will bring you to the root of your Evidence project, and the rest of your relative path should work as expected.

:::

## SQL Syntax for Querying CSVs
Evidence uses DuckDB to run SQL against a CSV file. 

[See the DuckDB docs for information on query syntax](https://duckdb.org/docs/sql/query_syntax/select)

## Issues with Headers
If you run into problems getting your query to recognize the headers in your CSV file, you can use the `read_csv_auto` helper function provided by DuckDB. For example:
```sql
select * from read_csv_auto('source/myfile.csv', HEADER=TRUE);
```

In addition to the `HEADER` argument, this function can also accept changes to the delimeter (`DELIM`), quotes (`QUOTE`), and more. 

[Additional information about CSV helper functions can be found in DuckDB's docs here.](https://duckdb.org/docs/data/csv)
