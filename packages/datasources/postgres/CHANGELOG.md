# @evidence-dev/postgres

## 1.0.10

### Patch Changes

- Updated dependencies [937971eaa]
  - @evidence-dev/db-commons@1.1.1

## 1.0.9

### Patch Changes

- Updated dependencies [b28f63f23]
  - @evidence-dev/db-commons@1.1.0

## 1.0.8

### Patch Changes

- e81b6fe87: makes tests conditional on having creds

## 1.0.7

### Patch Changes

- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6

## 1.0.6

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/db-commons@1.0.5

## 1.0.5

### Patch Changes

- e2176af7: apply `standardizeResult` to first batch of postgres results
- 5e0bbf31: stop blocking advanced usage of json with usql
- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4

## 1.0.4

### Patch Changes

- 32a38858: More informative pg errors

## 1.0.3

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
  - @evidence-dev/db-commons@1.0.3

## 1.0.2

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- d04554f1: - Remove legacy env vars
  - Add rejectUnauthorized option
- Updated dependencies [fc7fe470]
  - @evidence-dev/db-commons@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-commons@1.0.1

## 1.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- 44d3c797: adds options parameter to postgres connection settings
- 1320795a: Prevent postgres from hanging when testing connection
- bf4a112a: Update package.json to use new datasource field
- c4822852: Support for streaming results
- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- 20127231: Bump all versions so version pinning works
- 29c149d6: added stricter types to db adapters
- Updated dependencies [bf4a112a]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [781d2677]
- Updated dependencies [20127231]
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1

## 1.0.0-usql.8

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 1.0.0-usql.7

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4

## 1.0.0-usql.6

### Patch Changes

- 1320795a: Prevent postgres from hanging when testing connection

## 1.0.0-usql.5

### Patch Changes

- 44d3c797: adds options parameter to postgres connection settings

## 1.0.0-usql.4

### Patch Changes

- Updated dependencies [cd57ba69]
  - @evidence-dev/db-commons@0.2.1-usql.3

## 1.0.0-usql.3

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.2

## 1.0.0-usql.2

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/db-commons@0.2.1-usql.1

## 1.0.0-usql.1

### Patch Changes

- 29c149d6: added stricter types to db adapters
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1-usql.0

## 1.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 0.3.1

### Patch Changes

- c2540d2f: Add support for Trino as a data source

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
