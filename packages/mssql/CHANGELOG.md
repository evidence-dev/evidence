# @evidence-dev/mssql

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 0.2.1

### Patch Changes

- 0d720b18: adjust sql server env variable handling
- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 0.2.0

### Minor Changes

- f15e5685: Added SQL Server driver
