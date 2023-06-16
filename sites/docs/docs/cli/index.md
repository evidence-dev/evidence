---
sidebar_position: 1
title: CLI Reference
hide_title: false
hide_table_of_contents: false
---

## Commands

| Command                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Start the development server in the current directory. |
| `npm run build`        | Build the project for production.                      |
| `npm run build:strict` | Build, but fails on query or component errors.         |
| `r`                    | Restart the dev server (when running).                 |

You can stop the server with `Ctrl` + `C` / `⌘` + `C`.

## Options

Append flags with an extra `--` after the command to modify behavior.

For example, `npm run dev -- --port 4000` will start the development server on port 4000.

Evidence runs a Vite server, and so supports [Vite's options](https://vitejs.dev/guide/cli.html#options).

Some of the most common are:

| Flag            | Description                                  | Detail                                               |
| --------------- | -------------------------------------------- | ---------------------------------------------------- |
| `--open [path]` | Open browser to `path` on startup (`string`) | Default `--open /` opens in root of the project.     |
| `--host [host]` | Specify hostname (`string`)                  | `--host 0.0.0.0` can be helpful in containers        |
| `--port <port>` | Specify port (`number`)                      | Automatically increment if default `3000` is in use. |

## Environment Variables

You can set environment variables to configure Evidence in both development and production.

Evidence does not currently support a `.env` file, but you can set environment variables in your terminal before running the command.

All Redshift environment variables are set using the PostgreSQL variables.

| Variable                            | Description                                                     | Options (if applicable)                                                               |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| EVIDENCE_DATABASE                   | The database to use.                                            | `bigquery` , `snowflake` , `redshift`, `postgres`, `mssql`, `mysql`, `sqlite`, `duckdb`, `csv` |
| EVIDENCE_BIGQUERY_PROJECT_ID        | BigQuery Project ID                                             |                                                                                       |
| EVIDENCE_BIGQUERY_CLIENT_EMAIL      | BigQuery Client Email                                           |                                                                                       |
| EVIDENCE_BIGQUERY_PRIVATE_KEY       | BigQuery Private Key                                            |                                                                                       |
| EVIDENCE_BIGQUERY_AUTHENTICATOR     | BigQuery Authenticator                                          | `oauth`, `gcloud-cli`, `service-account`                                              |
| EVIDENCE_BIGQUERY_TOKEN             | BigQuery OAuth Token                                            |                                                                                       |
| EVIDENCE_SNOWFLAKE_ACCOUNT          | Snowflake Account ID                                            |                                                                                       |
| EVIDENCE_SNOWFLAKE_USERNAME         | Snowflake Username                                              |                                                                                       |
| EVIDENCE_SNOWFLAKE_PASSWORD         | Snowflake Password                                              |                                                                                       |
| EVIDENCE_SNOWFLAKE_DATABASE         | Snowflake Database                                              |                                                                                       |
| EVIDENCE_SNOWFLAKE_WAREHOUSE        | Snowflake Warehouse                                             |                                                                                       |
| EVIDENCE_SNOWFLAKE_ROLE             | Snowflake Role                                                  |                                                                                       |
| EVIDENCE_SNOWFLAKE_SCHEMA           | Snowflake Schema                                                |                                                                                       |
| EVIDENCE_SNOWFLAKE_AUTHENTICATOR    | Snowflake Authenticator                                         | `snowflake_jwt`, `externalbrowser`, `okta`, `snowflake`                               |
| EVIDENCE_SNOWFLAKE_PRIVATE_KEY      | Snowflake Private Key                                           |                                                                                       |
| EVIDENCE_SNOWFLAKE_PASSPHRASE       | Snowflake Passphrase                                            |                                                                                       |
| EVIDENCE_SNOWFLAKE_OKTA_URL         | Snowflake Okta URL                                              |                                                                                       |
| EVIDENCE_POSTGRES_USER              | Postgres Username                                               |                                                                                       |
| EVIDENCE_POSTGRES_HOST              | Postgres Host                                                   |                                                                                       |
| EVIDENCE_POSTGRES_DATABASE          | Postgres Database                                               |                                                                                       |
| EVIDENCE_POSTGRES_PASSWORD          | Postgres Password                                               |                                                                                       |
| EVIDENCE_POSTGRES_PORT              | Postgres Port                                                   |                                                                                       |
| EVIDENCE_POSTGRES_SCHEMA            | Postgres Schema                                                 |                                                                                       |
| EVIDENCE_POSTGRES_SSL               | Postgres SSL                                                    | `true` , `false`, `no-verify`                                                         |
| EVIDENCE_POSTGRES_CONNECTIONSTRING  | Postgres Connection String                                      |                                                                                       |
| EVIDENCE_MYSQL_USER                 | MySQL Username                                                  |                                                                                       |
| EVIDENCE_MYSQL_HOST                 | MySQL Host                                                      |                                                                                       |
| EVIDENCE_MYSQL_DATABASE             | MySQL Database                                                  |                                                                                       |
| EVIDENCE_MYSQL_PASSWORD             | MySQL Password                                                  |                                                                                       |
| EVIDENCE_MYSQL_PORT                 | MySQL Port                                                      |                                                                                       |
| EVIDENCE_MYSQL_SOCKETPATH           | MySQL Socket Path                                               |                                                                                       |
| EVIDENCE_MYSQL_SSL                  | MySQL SSL                                                       | `true` , `false`, `no-verify`                                                         |
| EVIDENCE_SQLITE_FILENAME            | SQLite Filename                                                 |                                                                                       |
| EVIDENCE_DUCKDB_FILENAME            | DuckDB Filename                                                 |                                                                                       |
| SEND_ANONYMOUS_USAGE_STATS          | Send [anonymous usage stats](localhost:3000/settings#telemetry) | `yes` , `no`                                                                          |
