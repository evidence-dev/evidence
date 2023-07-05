# @evidence-dev/redshift

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- Updated dependencies [cb0fc468]
  - @evidence-dev/postgres@1.0.0-usql.0

## 0.0.6

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0
  - @evidence-dev/postgres@0.3.0

## 0.0.5

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3
  - @evidence-dev/postgres@0.2.6

## 0.0.4

### Patch Changes

- Updated dependencies [c013859]
  - @evidence-dev/postgres@0.2.5

## 0.0.3

### Patch Changes

- Updated dependencies [bb5d0e2]
  - @evidence-dev/db-commons@0.1.2
  - @evidence-dev/postgres@0.2.4

## 0.0.2

### Patch Changes

- e2383bb: Adding Redshift to the UI
