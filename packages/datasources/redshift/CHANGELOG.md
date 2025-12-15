# @evidence-dev/redshift

## 1.0.10

### Patch Changes

- Updated dependencies [937971eaa]
  - @evidence-dev/db-commons@1.1.1
  - @evidence-dev/postgres@1.0.10

## 1.0.9

### Patch Changes

- Updated dependencies [b28f63f23]
  - @evidence-dev/db-commons@1.1.0
  - @evidence-dev/postgres@1.0.9

## 1.0.8

### Patch Changes

- Updated dependencies [e81b6fe87]
  - @evidence-dev/postgres@1.0.8

## 1.0.7

### Patch Changes

- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6
  - @evidence-dev/postgres@1.0.7

## 1.0.6

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/postgres@1.0.6
  - @evidence-dev/db-commons@1.0.5

## 1.0.5

### Patch Changes

- Updated dependencies [1da26c4e]
- Updated dependencies [e2176af7]
- Updated dependencies [5e0bbf31]
  - @evidence-dev/db-commons@1.0.4
  - @evidence-dev/postgres@1.0.5

## 1.0.4

### Patch Changes

- Updated dependencies [32a38858]
  - @evidence-dev/postgres@1.0.4

## 1.0.3

### Patch Changes

- Updated dependencies [31381835]
- Updated dependencies [2bcbf0ed]
  - @evidence-dev/db-commons@1.0.3
  - @evidence-dev/postgres@1.0.3

## 1.0.2

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- Updated dependencies [0e0a4392]
- Updated dependencies [d04554f1]
- Updated dependencies [fc7fe470]
  - @evidence-dev/postgres@1.0.2
  - @evidence-dev/db-commons@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-commons@1.0.1
  - @evidence-dev/postgres@1.0.1

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
- 20127231: Bump all versions so version pinning works
- 29c149d6: added stricter types to db adapters
- Updated dependencies [44d3c797]
- Updated dependencies [1320795a]
- Updated dependencies [cb0fc468]
- Updated dependencies [bf4a112a]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [781d2677]
- Updated dependencies [20127231]
- Updated dependencies [29c149d6]
  - @evidence-dev/postgres@1.0.0
  - @evidence-dev/db-commons@0.2.1

## 1.0.0-usql.8

### Patch Changes

- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5
  - @evidence-dev/postgres@1.0.0-usql.8

## 1.0.0-usql.7

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4
  - @evidence-dev/postgres@1.0.0-usql.7

## 1.0.0-usql.6

### Patch Changes

- Updated dependencies [1320795a]
  - @evidence-dev/postgres@1.0.0-usql.6

## 1.0.0-usql.5

### Patch Changes

- Updated dependencies [44d3c797]
  - @evidence-dev/postgres@1.0.0-usql.5

## 1.0.0-usql.4

### Patch Changes

- Updated dependencies [cd57ba69]
  - @evidence-dev/db-commons@0.2.1-usql.3
  - @evidence-dev/postgres@1.0.0-usql.4

## 1.0.0-usql.3

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.2
  - @evidence-dev/postgres@1.0.0-usql.3

## 1.0.0-usql.2

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/db-commons@0.2.1-usql.1
  - @evidence-dev/postgres@1.0.0-usql.2

## 1.0.0-usql.1

### Patch Changes

- 29c149d6: added stricter types to db adapters
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1-usql.0
  - @evidence-dev/postgres@1.0.0-usql.1

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

## 0.0.7

### Patch Changes

- Updated dependencies [c2540d2f]
  - @evidence-dev/postgres@0.3.1

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
