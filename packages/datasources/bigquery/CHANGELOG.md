# @evidence-dev/bigquery

## 2.0.8

### Patch Changes

- bb0576d5b: Added the ability to specify BigQuery Region in the connection setting.

## 2.0.7

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [6cdedceb0]
  - @evidence-dev/db-commons@1.0.5

## 2.0.6

### Patch Changes

- 6421c6d9b: Add icon to source configuration

## 2.0.5

### Patch Changes

- Updated dependencies [1da26c4e]
  - @evidence-dev/db-commons@1.0.4

## 2.0.4

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources
- Updated dependencies [31381835]
  - @evidence-dev/db-commons@1.0.3

## 2.0.3

### Patch Changes

- e023deb0: Make sure credentials are properly transformed

## 2.0.2

### Patch Changes

- 0e0a4392: Add skeleton README files for adapters
- d4fc618e: - Removed legacy environment variable configuration
  - Adjusted connection to use a function
  - Connection Test now uses a connection directly; rather than runQuery
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

- 9ff614d2: fix bigquery types timing out for large queries
- bf4a112a: Update package.json to use new datasource field
- bdf8e08a: revamp value standardization in bigquery adapter
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

## 2.0.0-usql.7

### Patch Changes

- 9ff614d2: fix bigquery types timing out for large queries

## 2.0.0-usql.6

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 2.0.0-usql.5

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4

## 2.0.0-usql.4

### Patch Changes

- Updated dependencies [cd57ba69]
  - @evidence-dev/db-commons@0.2.1-usql.3

## 2.0.0-usql.3

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.2

## 2.0.0-usql.2

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/db-commons@0.2.1-usql.1

## 2.0.0-usql.1

### Patch Changes

- bdf8e08a: revamp value standardization in bigquery adapter
- 29c149d6: added stricter types to db adapters
- Updated dependencies [29c149d6]
  - @evidence-dev/db-commons@0.2.1-usql.0

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 1.3.2

### Patch Changes

- 518056e8: fix for private key formatting in production

## 1.3.1

### Patch Changes

- 44c0c4ca: changed bigquery default connector

## 1.3.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity
- 5b6156d9: added support for new authentication methods for bigquery and snowflake

### Patch Changes

- Updated dependencies [4c04edd0]
  - @evidence-dev/db-commons@0.2.0

## 1.2.5

### Patch Changes

- 7b2177e5: "Fixed an issue with wide numeric type columns values not showing up on Evidence"

## 1.2.4

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/db-commons@0.1.3

## 1.2.3

### Patch Changes

- Updated dependencies [bb5d0e2]
  - @evidence-dev/db-commons@0.1.2

## 1.2.2

### Patch Changes

- 23d0234: Adds legacy FLOAT type to BigQuery connector types

## 1.2.1

### Patch Changes

- Updated dependencies [942488c]
  - @evidence-dev/db-commons@0.1.1

## 1.2.0

### Minor Changes

- cb6d561: Native type support for MySQL, SQL Lite, and Snowflake and extracted common DB functionality to a shared package.

### Patch Changes

- Updated dependencies [cb6d561]
  - @evidence-dev/db-commons@0.1.0

## 1.1.0

### Minor Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.1

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections
