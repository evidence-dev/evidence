# @evidence-dev/csv

## 1.0.15

### Patch Changes

- Updated dependencies [b28f63f23]
  - @evidence-dev/duckdb@2.0.0
  - @evidence-dev/db-commons@1.1.0

## 1.0.14

### Patch Changes

- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6
  - @evidence-dev/duckdb@1.0.13

## 1.0.13

### Patch Changes

- Updated dependencies [43502807b]
  - @evidence-dev/duckdb@1.0.12

## 1.0.12

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [e74affd64]
- Updated dependencies [6cdedceb0]
  - @evidence-dev/duckdb@1.0.11
  - @evidence-dev/db-commons@1.0.5

## 1.0.11

### Patch Changes

- Updated dependencies [06c1e74e5]
- Updated dependencies [cd9e7df35]
  - @evidence-dev/duckdb@1.0.10

## 1.0.10

### Patch Changes

- 6421c6d9b: Add icon to source configuration

## 1.0.9

### Patch Changes

- Updated dependencies [2b5f94e3]
  - @evidence-dev/duckdb@1.0.9

## 1.0.8

### Patch Changes

- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4
  - @evidence-dev/duckdb@1.0.8

## 1.0.7

### Patch Changes

- Updated dependencies [0c1a7ccb]
  - @evidence-dev/duckdb@1.0.7

## 1.0.6

### Patch Changes

- Updated dependencies [ddf584d4]
  - @evidence-dev/duckdb@1.0.6

## 1.0.5

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
- Updated dependencies [2bcbf0ed]
  - @evidence-dev/db-commons@1.0.3
  - @evidence-dev/duckdb@1.0.5

## 1.0.4

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- f33b58c5: - Added options option to let users specify read_csv options
  - Updated function to explicitly use read_csv, rather than the csv filename directly
  - Defaulted read_csv to auto_detect unless otherwise specified
- Updated dependencies [0e0a4392]
- Updated dependencies [2a663d79]
- Updated dependencies [fc7fe470]
  - @evidence-dev/duckdb@1.0.4
  - @evidence-dev/db-commons@1.0.2

## 1.0.3

### Patch Changes

- Updated dependencies [deb2ab6b]
  - @evidence-dev/duckdb@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-commons@1.0.1
  - @evidence-dev/duckdb@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/duckdb@1.0.1

## 1.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Minor Changes

- 3b49d3b6: Update csv adapter to function as db plugin

### Patch Changes

- bf4a112a: Update package.json to use new datasource field
- c4822852: Support for streaming results
- 08b1907f: Ensure ":memory:" is passed as db to duckdb connector
- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- 20127231: Bump all versions so version pinning works
- 29c149d6: added stricter types to db adapters
- Updated dependencies [e23691d0]
- Updated dependencies [af4a8a1e]
- Updated dependencies [cb0fc468]
- Updated dependencies [bf4a112a]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [781d2677]
- Updated dependencies [96e96568]
- Updated dependencies [20127231]
- Updated dependencies [29c149d6]
  - @evidence-dev/duckdb@1.0.0
  - @evidence-dev/db-commons@0.2.1

## 1.0.0-usql.11

### Patch Changes

- Updated dependencies [af4a8a1e]
  - @evidence-dev/duckdb@1.0.0-usql.10

## 1.0.0-usql.10

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5
  - @evidence-dev/duckdb@1.0.0-usql.9

## 1.0.0-usql.9

### Patch Changes

- Updated dependencies [e23691d0]
  - @evidence-dev/duckdb@1.0.0-usql.8

## 1.0.0-usql.8

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4
  - @evidence-dev/duckdb@1.0.0-usql.7

## 1.0.0-usql.7

### Patch Changes

- Updated dependencies [96e96568]
  - @evidence-dev/duckdb@1.0.0-usql.6

## 1.0.0-usql.6

### Patch Changes

- Updated dependencies [cd57ba69]
  - @evidence-dev/db-commons@0.2.1-usql.3
  - @evidence-dev/duckdb@1.0.0-usql.5

## 1.0.0-usql.5

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.2
  - @evidence-dev/duckdb@1.0.0-usql.4

## 1.0.0-usql.4

### Patch Changes

- 08b1907f: Ensure ":memory:" is passed as db to duckdb connector
- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/db-commons@0.2.1-usql.1
  - @evidence-dev/duckdb@1.0.0-usql.3

## 1.0.0-usql.3

### Patch Changes

- 29c149d6: added stricter types to db adapters
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1-usql.0
  - @evidence-dev/duckdb@1.0.0-usql.2

## 0.1.8

### Patch Changes

- Updated dependencies [27e6ea4b]
  - @evidence-dev/duckdb@0.3.0

## 0.1.7

### Patch Changes

- Updated dependencies [1f9a840c]
  - @evidence-dev/duckdb@0.2.1

## 0.1.6

### Patch Changes

- Updated dependencies [134b7d13]
  - @evidence-dev/duckdb@0.2.0

## 0.1.5

### Patch Changes

- Updated dependencies [4e783f36]
- Updated dependencies [e12fef6c]
  - @evidence-dev/duckdb@0.1.1

## 1.0.0-usql.2

### Minor Changes

- 3b49d3b6: Update csv adapter to function as db plugin

## 1.0.0-usql.1

### Patch Changes

- Updated dependencies [e12fef6c]
  - @evidence-dev/duckdb@1.0.0-usql.1

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
