# @evidence-dev/snowflake

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 0.3.1

### Patch Changes

- 168af3bb: Add optional role and schema fields for snowflake

## 0.3.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity
- 5b6156d9: added support for new authentication methods for bigquery and snowflake

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 0.2.0

### Minor Changes

- f7a08956: Addition of missing dependencies in multiple pkg, fix the LinkedChart by moving to svelte:component

## 0.1.5

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3

## 0.1.4

### Patch Changes

- Updated dependencies [bb5d0e2]
  - @evidence-dev/db-commons@0.1.2

## 0.1.3

### Patch Changes

- aa70947: Updated version of snowflake sdk used in connector

## 0.1.2

### Patch Changes

- 7a87d0b: Add support for native database types to all components

## 0.1.1

### Patch Changes

- Updated dependencies [942488c]
  - @evidence-dev/db-commons@0.1.1

## 0.1.0

### Minor Changes

- cb6d561: Native type support for MySQL, SQL Lite, and Snowflake and extracted common DB functionality to a shared package.

### Patch Changes

- Updated dependencies [cb6d561]
  - @evidence-dev/db-commons@0.1.0

## 0.0.9

### Patch Changes

- f651bda: Adding a database and warehouse field to the Snowflake connector. Without these it is difficult to run queries in a Snowflake DB.

## 0.0.8

### Patch Changes

- 64daf72: Update vendor sdk
- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 0.0.8-next.1

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 0.0.8-next.0

### Patch Changes

- Update vendor sdk
