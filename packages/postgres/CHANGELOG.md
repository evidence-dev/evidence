# @evidence-dev/postgres

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 0.3.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 0.2.6

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3

## 0.2.5

### Patch Changes

- c013859: Adds optional schema field for postgres connector

## 0.2.4

### Patch Changes

- Updated dependencies [bb5d0e2]
  - @evidence-dev/db-commons@0.1.2

## 0.2.3

### Patch Changes

- 8938e51: Fix postgres connector to handle cases consistently between query object and types object

## 0.2.2

### Patch Changes

- 194de3a: include db commons dep

## 0.2.1

### Patch Changes

- Updated dependencies [942488c]
  - @evidence-dev/db-commons@0.1.1

## 0.2.0

### Minor Changes

- cb6d561: Native type support for MySQL, SQL Lite, and Snowflake and extracted common DB functionality to a shared package.

### Patch Changes

- Updated dependencies [cb6d561]
  - @evidence-dev/db-commons@0.1.0

## 0.1.0

### Minor Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components
