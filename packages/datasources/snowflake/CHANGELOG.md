# @evidence-dev/snowflake

## 1.2.0

### Minor Changes

- 0e740d056: add resultPrefetch option to snowflake connector

## 1.1.2

### Patch Changes

- 67dbd116b: Adds support for Multiline strings as source config
  Moves snowflake private key to multi-line string field

## 1.1.1

### Patch Changes

- bf04c39ef: Patches CVE

## 1.1.0

### Minor Changes

- 0de6bc76c: Add Proxy config section/options to snowflake connector

## 1.0.7

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/db-commons@1.0.5

## 1.0.6

### Patch Changes

- 6421c6d9b: Add icon to source configuration

## 1.0.5

### Patch Changes

- a95db3d3: Move types to devDependencies

## 1.0.4

### Patch Changes

- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4

## 1.0.3

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
  - @evidence-dev/db-commons@1.0.3

## 1.0.2

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- 7e401d4d: - Manually close connection
  - Remove legacy env vars
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
- 6505351f: Misc Fixes
- 20127231: Bump all versions so version pinning works
- 29c149d6: added stricter types to db adapters
- Updated dependencies [bf4a112a]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [781d2677]
- Updated dependencies [20127231]
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1

## 1.0.0-usql.7

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 1.0.0-usql.6

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4

## 1.0.0-usql.5

### Patch Changes

- 6505351f: Misc Fixes

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

## 0.3.3

### Patch Changes

- f36450f5: bump snowflake-sdk version

## 0.3.2

### Patch Changes

- a1fa819e: bump vulnerable deps

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
