# @evidence-dev/csv

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- Updated dependencies [cb0fc468]
- Updated dependencies [4e783f36]
  - @evidence-dev/duckdb@1.0.0-usql.0

## 0.1.4

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0
  - @evidence-dev/duckdb@0.1.0

## 0.1.3

### Patch Changes

- Updated dependencies [57217c6e]
  - @evidence-dev/duckdb@0.0.6

## 0.1.2

### Patch Changes

- fb5e6088: [fix] - use in-memory database for DuckDB Layer in CSV Connector

## 0.1.1

### Patch Changes

- Updated dependencies [d81c3af]
  - @evidence-dev/duckdb@0.0.5

## 0.1.0

### Minor Changes

- 005a55e: Add CSV connector

### Patch Changes

- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3
  - @evidence-dev/duckdb@0.0.3
