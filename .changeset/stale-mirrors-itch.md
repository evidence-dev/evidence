---
'@evidence-dev/duckdb': major
'@evidence-dev/universal-sql': major
'@evidence-dev/mssql': minor
'@evidence-dev/db-commons': minor
'@evidence-dev/core-components': minor
---

Update DuckDB to latest packages

Update DuckDB to latest packages:

- Switch to @duckdb/node-api from duckdb-async
- Update duckdb-wasm to latest release

This release also has small data fixes across several packages:

- Better handling of NULL values when discovering column types
- Fix batch processing of parquet files
- Fix error with temporary parquet files when reloading data in dev environment
- Better handing of error messages for the MSSQL driver in dev environment
