---
sidebar_position: 1
title: CLI Reference
hide_title: false
hide_table_of_contents: false
---

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server in the current directory. |
| `npm run build` | Build the project for production. |
| `npm run build:strict` | Build, but fails on query or component errors. |

## Options

Append flags with an extra `--` after the command to modify behavior.

For example, `npm run dev -- --port 4000` will start the development server on port 4000.

Evidence runs a Vite server, and so supports [Vite's options](https://vitejs.dev/guide/cli.html#options).

Some of the most common are:

| Flag | Description | Detail |
| --- | --- | --- |
| `--open [path]` | Open browser to `path` on startup (`string`) | Default `--open /` opens in root of the project. |
| `--host [host]` | Specify hostname (`string`) | `--host 0.0.0.0` can be helpful in containers | 
| `--port <port>` | Specify port (`number`) | Automatically increment if default `3000` is in use. |

## Environment Variables

You can set environment variables to configure Evidence in both development and production.

Evidence does not currently support a `.env` file, but you can set environment variables in your terminal before running the command.

All Redshift environment variables are set using the PostgreSQL variables.

| Variable | Description | Options (if applicable) |
| --- | --- | --- |
| DATABASE | The database to use. | `bigquery` , `snowflake` , `redshift`, `postgres`, `mysql`, `sqlite`, `duckdb`, `csv`
| BIGQUERY_PROJECT_ID | BigQuery Project ID ||
| BIGQUERY_CLIENT_EMAIL | BigQuery Client Email ||
| BIGQUERY_PRIVATE_KEY | BigQuery Private Key ||
| SNOWFLAKE_ACCOUNT | Snowflake Account ID ||
| SNOWFLAKE_USERNAME | Snowflake Username ||
| SNOWFLAKE_PASSWORD | Snowflake Password ||
| SNOWFLAKE_DATABASE | Snowflake Database ||
| SNOWFLAKE_WAREHOUSE | Snowflake Warehouse ||
| POSTGRES_USER | Postgres Username ||
| POSTGRES_HOST | Postgres Host ||
| POSTGRES_DATABASE | Postgres Database ||
| POSTGRES_PASSWORD | Postgres Password ||
| POSTGRES_PORT | Postgres Port ||
| POSTGRES_SCHEMA | Postgres Schema ||
| POSTGRES_SSL | Postgres SSL | `true` , `false`, `no-verify` |
| POSTGRES_CONNECTIONSTRING | Postgres Connection String ||
| MYSQL_USER | MySQL Username ||
| MYSQL_HOST | MySQL Host ||
| MYSQL_DATABASE | MySQL Database ||
| MYSQL_PASSWORD | MySQL Password ||
| MYSQL_PORT | MySQL Port ||
| MYSQL_SOCKETPATH | MySQL Socket Path ||
| MYSQL_SSL | MySQL SSL | `true` , `false`, `no-verify` |
| SQLITE_FILENAME | SQLite Filename ||
| DUCKDB_FILENAME | DuckDB Filename ||
| SEND_ANONYMOUS_USAGE_STATS | Send [anonymous usage stats](localhost:3000/settings#telemetry) | `yes` , `no` |

