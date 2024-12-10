# @evidence-dev/mssql

## 1.1.2

### Patch Changes

- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6

## 1.1.1

### Patch Changes

- 330bb5336: Add requestTimeout to mssql connector

## 1.1.0

### Minor Changes

- bcd56f5bd: Add alternatives authentication methods

### Patch Changes

- 2d89e4624: Add connectionTimeout option to mssql connector

## 1.0.10

### Patch Changes

- 9bbf152d5: Remove icon

## 1.0.9

### Patch Changes

- 16b69f04e: Update mssql to v11 to resolve security vulnerability in @azure/identity

## 1.0.8

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/db-commons@1.0.5

## 1.0.7

### Patch Changes

- a95db3d3: Move types to devDependencies

## 1.0.6

### Patch Changes

- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4

## 1.0.5

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
  - @evidence-dev/db-commons@1.0.3

## 1.0.4

### Patch Changes

- 168f1c9e: Fix boolean config options for MSSQL and Trino

## 1.0.3

### Patch Changes

- 722a4e00: Rename host -> server

## 1.0.2

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- 3295b672: - Remove legacy environment variables
  - Close connection manually after results are exhausted
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

## 1.0.0-usql.6

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 1.0.0-usql.5

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4

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

## 0.2.1

### Patch Changes

- 0d720b18: adjust sql server env variable handling
- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 0.2.0

### Minor Changes

- f15e5685: Added SQL Server driver
