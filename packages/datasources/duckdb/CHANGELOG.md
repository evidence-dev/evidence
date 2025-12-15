# @evidence-dev/duckdb

## 2.0.1

### Patch Changes

- 937971eaa: Package updates for CVEs. See https://github.com/evidence-dev/evidence/pull/3253
- Updated dependencies [937971eaa]
  - @evidence-dev/db-commons@1.1.1

## 2.0.0

### Major Changes

- b28f63f23: Update DuckDB to latest packages:

  - Switch to @duckdb/node-api from duckdb-async
  - Update duckdb-wasm to latest release

  This release also has small data fixes across several packages:

  - Better handling of NULL values when discovering column types
  - Fix batch processing of parquet files
  - Fix error with temporary parquet files when reloading data in dev environment

### Patch Changes

- Updated dependencies [b28f63f23]
  - @evidence-dev/db-commons@1.1.0

## 1.0.13

### Patch Changes

- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6

## 1.0.12

### Patch Changes

- 43502807b: Upgrade duckdb-async to 1.1.3

## 1.0.11

### Patch Changes

- e74affd64: Rearrange execution order; remove useless try/catch
- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/db-commons@1.0.5

## 1.0.10

### Patch Changes

- 06c1e74e5: Add support for `initialize.sql`
- cd9e7df35: Bumps duckDB connector to 1.0

## 1.0.9

### Patch Changes

- 2b5f94e3: Bump to 10.0.2

## 1.0.8

### Patch Changes

- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4

## 1.0.7

### Patch Changes

- 0c1a7ccb: Upgrade DuckDB to 0.10.0, add custom user agent

## 1.0.6

### Patch Changes

- ddf584d4: Allow motherduck connections to specify the database

## 1.0.5

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
  - @evidence-dev/db-commons@1.0.3

## 1.0.4

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- 2a663d79: Remove legacy configuration option; use new closeConnection callback
- Updated dependencies [fc7fe470]
  - @evidence-dev/db-commons@1.0.2

## 1.0.3

### Patch Changes

- deb2ab6b: Allow MotherDuck and in-memory DuckDB connections

## 1.0.2

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-commons@1.0.1

## 1.0.1

### Patch Changes

- Correct a dependency on db-commons

## 1.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- e23691d0: Handle errors during source query execution
- af4a8a1e: Explicit mappings for all DuckDB types
- bf4a112a: Update package.json to use new datasource field
- c4822852: Support for streaming results
- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- 96e96568: Upgrade ddb package; return more useful error messages
- 20127231: Bump all versions so version pinning works
- 29c149d6: added stricter types to db adapters
- Updated dependencies [bf4a112a]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [781d2677]
- Updated dependencies [20127231]
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1

## 1.0.0-usql.10

### Patch Changes

- af4a8a1e: Explicit mappings for all DuckDB types

## 1.0.0-usql.9

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 1.0.0-usql.8

### Patch Changes

- e23691d0: Handle errors during source query execution

## 1.0.0-usql.7

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4

## 1.0.0-usql.6

### Patch Changes

- 96e96568: Upgrade ddb package; return more useful error messages

## 1.0.0-usql.5

### Patch Changes

- Updated dependencies [cd57ba69]
  - @evidence-dev/db-commons@0.2.1-usql.3

## 1.0.0-usql.4

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.2

## 1.0.0-usql.3

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/db-commons@0.2.1-usql.1

## 1.0.0-usql.2

### Patch Changes

- 29c149d6: added stricter types to db adapters
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1-usql.0

## 0.3.0

### Minor Changes

- 27e6ea4b: upgrade duckdb to 0.9.2

## 0.2.1

### Patch Changes

- 1f9a840c: upgrade duckdb to 0.9.1

## 0.2.0

### Minor Changes

- 134b7d13: Allow connection to MotherDuck

## 0.1.1

### Patch Changes

- 4e783f36: get precise types instead of inferring
- e12fef6c: Bump DuckDB to 0.8.1

## 1.0.0-usql.1

### Patch Changes

- e12fef6c: Bump DuckDB to 0.8.1

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
