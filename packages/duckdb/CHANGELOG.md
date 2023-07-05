# @evidence-dev/duckdb

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- 4e783f36: get precise types instead of inferring

## 0.1.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 0.0.6

### Patch Changes

- 57217c6e: version bump duckdb-async to 0.8.0

## 0.0.5

### Patch Changes

- d81c3af: update to duckdb 0.7.1

## 0.0.3

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3

## 0.0.2

### Patch Changes

- a4371ed: Bump duckdb to 0.6.1 to fix issue with incorrect binary

## 0.0.1
