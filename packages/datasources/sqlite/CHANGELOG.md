# @evidence-dev/sqlite

## 2.0.8

### Patch Changes

- Updated dependencies [b28f63f23]
  - @evidence-dev/db-commons@1.1.0

## 2.0.7

### Patch Changes

- cb5687cd9: fix(db): Fix bug that tried to read undefined db data
- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6

## 2.0.6

### Patch Changes

- df8e87625: Parse date column string values to real dates

## 2.0.5

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/db-commons@1.0.5

## 2.0.4

### Patch Changes

- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4

## 2.0.3

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
  - @evidence-dev/db-commons@1.0.3

## 2.0.2

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- 38cc19db: - Remove legacy environment variables
  - Manually close connection
- Updated dependencies [fc7fe470]
  - @evidence-dev/db-commons@1.0.2

## 2.0.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-commons@1.0.1

## 2.0.0

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
- cff22ece: Fix SQLite database wrapper
- 29c149d6: added stricter types to db adapters
- Updated dependencies [bf4a112a]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [781d2677]
- Updated dependencies [20127231]
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1

## 2.0.0-usql.7

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 2.0.0-usql.6

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4

## 2.0.0-usql.5

### Patch Changes

- Updated dependencies [cd57ba69]
  - @evidence-dev/db-commons@0.2.1-usql.3

## 2.0.0-usql.4

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.2

## 2.0.0-usql.3

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/db-commons@0.2.1-usql.1

## 2.0.0-usql.2

### Patch Changes

- 29c149d6: added stricter types to db adapters
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1-usql.0

## 2.0.0-usql.1

### Patch Changes

- cff22ece: Fix SQLite database wrapper

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 1.2.1

### Patch Changes

- a1fa819e: bump vulnerable deps

## 1.2.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 1.1.4

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3

## 1.1.3

### Patch Changes

- e93acbf: Bumping dependency for sqlite3 to resolve issues with install time on arm64
- Updated dependencies [bb5d0e2]
  - @evidence-dev/db-commons@0.1.2

## 1.1.2

### Patch Changes

- 194de3a: include db commons dep

## 1.1.1

### Patch Changes

- Updated dependencies [942488c]
  - @evidence-dev/db-commons@0.1.1

## 1.1.0

### Minor Changes

- cb6d561: Native type support for MySQL, SQL Lite, and Snowflake and extracted common DB functionality to a shared package.

### Patch Changes

- Updated dependencies [cb6d561]
  - @evidence-dev/db-commons@0.1.0

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 64daf72: Update vendor sdk
- 3d0d93c: Various UI changes
- 99c1d08: Fixes location of sqlite database files in an Evidence project
- a50f8c2: fix sqlite gitignore error, settings optionals, and misc UI fixes
- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.5

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.4

### Patch Changes

- 3d0d93c: Various UI changes

## 1.0.0-next.3

### Patch Changes

- 99c1d08: Fixes location of sqlite database files in an Evidence project

## 1.0.0-next.2

### Patch Changes

- Fixes sqlite gitignore error, settings optionals, and misc UI bugs

## 1.0.0-next.1

### Patch Changes

- Update vendor sdk

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

## 0.0.2

### Patch Changes

- 09edb57: Add SQLite database connector
