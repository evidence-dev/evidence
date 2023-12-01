# @evidence-dev/db-orchestrator

## 2.3.4

### Patch Changes

- Updated dependencies [27e6ea4b]
- Updated dependencies [d1cf6dc9]
  - @evidence-dev/duckdb@0.3.0
  - @evidence-dev/telemetry@1.0.6
  - @evidence-dev/csv@0.1.8

## 2.3.3

### Patch Changes

- Updated dependencies [f36450f5]
  - @evidence-dev/snowflake@0.3.3

## 2.3.2

### Patch Changes

- Updated dependencies [1f9a840c]
  - @evidence-dev/duckdb@0.2.1
  - @evidence-dev/csv@0.1.7

## 2.3.1

### Patch Changes

- Updated dependencies [518056e8]
  - @evidence-dev/bigquery@1.3.2

## 2.3.0

### Minor Changes

- 5b5959f9: add databricks connector

### Patch Changes

- c2540d2f: Add support for Trino as a data source
- Updated dependencies [5b5959f9]
- Updated dependencies [c2540d2f]
  - @evidence-dev/databricks@0.1.0
  - @evidence-dev/postgres@0.3.1
  - @evidence-dev/trino@0.1.1
  - @evidence-dev/redshift@0.0.7

## 2.2.5

### Patch Changes

- 615a2498: add clearer error handling to db-orchestrator
- Updated dependencies [a1fa819e]
- Updated dependencies [d92008d7]
  - @evidence-dev/snowflake@0.3.2
  - @evidence-dev/sqlite@1.2.1
  - @evidence-dev/mysql@0.3.1

## 2.2.4

### Patch Changes

- Updated dependencies [134b7d13]
  - @evidence-dev/duckdb@0.2.0
  - @evidence-dev/csv@0.1.6

## 2.2.3

### Patch Changes

- Updated dependencies [4e783f36]
- Updated dependencies [e12fef6c]
  - @evidence-dev/duckdb@0.1.1
  - @evidence-dev/csv@0.1.5

## 2.2.2

### Patch Changes

- Updated dependencies [168af3bb]
  - @evidence-dev/snowflake@0.3.1

## 2.2.1

### Patch Changes

- Updated dependencies [44c0c4ca]
  - @evidence-dev/bigquery@1.3.1

## 2.2.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity

### Patch Changes

- Updated dependencies [4c04edd0]
- Updated dependencies [5b6156d9]
- Updated dependencies [0d720b18]
  - @evidence-dev/bigquery@1.3.0
  - @evidence-dev/db-commons@0.2.0
  - @evidence-dev/duckdb@0.1.0
  - @evidence-dev/mysql@0.3.0
  - @evidence-dev/postgres@0.3.0
  - @evidence-dev/snowflake@0.3.0
  - @evidence-dev/sqlite@1.2.0
  - @evidence-dev/mssql@0.2.1
  - @evidence-dev/csv@0.1.4
  - @evidence-dev/redshift@0.0.6

## 2.1.3

### Patch Changes

- Updated dependencies [57217c6e]
  - @evidence-dev/duckdb@0.0.6
  - @evidence-dev/csv@0.1.3

## 2.1.2

### Patch Changes

- 1c330b52: stop default connection to duckdb

## 2.1.1

### Patch Changes

- f34ac566: added default connection to duckdb

## 2.1.0

### Minor Changes

- f15e5685: Added SQL Server driver

### Patch Changes

- Updated dependencies [f15e5685]
  - @evidence-dev/mssql@0.2.0

## 2.0.3

### Patch Changes

- Updated dependencies [fb5e6088]
- Updated dependencies [7b2177e5]
  - @evidence-dev/csv@0.1.2
  - @evidence-dev/bigquery@1.2.5

## 2.0.2

### Patch Changes

- fa958c52: Performance Improvements; Queries now run in batches of 2; Charts are less eager to resize

## 2.0.1

### Patch Changes

- Updated dependencies [f7a08956]
  - @evidence-dev/snowflake@0.2.0

## 2.0.0

### Major Changes

- 96c9c81: Upgrade to svelte kit 1.0.0, remove support for Node 14

### Patch Changes

- Updated dependencies [d81c3af]
  - @evidence-dev/duckdb@0.0.5
  - @evidence-dev/csv@0.1.1

## 1.3.1

### Patch Changes

- Updated dependencies [a7168a4]
  - @evidence-dev/mysql@0.2.0

## 1.3.0

### Minor Changes

- 005a55e: Add CSV connector

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [005a55e]
- Updated dependencies [c9dde3d]
  - @evidence-dev/csv@0.1.0
  - @evidence-dev/bigquery@1.2.4
  - @evidence-dev/db-commons@0.1.3
  - @evidence-dev/duckdb@0.0.3
  - @evidence-dev/mysql@0.1.5
  - @evidence-dev/postgres@0.2.6
  - @evidence-dev/redshift@0.0.5
  - @evidence-dev/snowflake@0.1.5
  - @evidence-dev/sqlite@1.1.4
  - @evidence-dev/telemetry@1.0.5

## 1.2.0

### Minor Changes

- c801fa9: New capability to fail build if there are errors in components or queries

### Patch Changes

- Updated dependencies [6f2dbf2]
  - @evidence-dev/mysql@0.1.4

## 1.1.12

### Patch Changes

- 8894ea3: Prevent redundant queries being executed during build for parameterized pages

## 1.1.11

### Patch Changes

- Updated dependencies [c013859]
  - @evidence-dev/postgres@0.2.5
  - @evidence-dev/redshift@0.0.4

## 1.1.10

### Patch Changes

- Updated dependencies [a4371ed]
  - @evidence-dev/duckdb@0.0.2

## 1.1.9

### Patch Changes

- 44b1412: Remove the need for a hard page refresh when editing queries, and provide live feedback on the status of queries while they run

## 1.1.8

### Patch Changes

- Updated dependencies [e93acbf]
- Updated dependencies [bb5d0e2]
  - @evidence-dev/sqlite@1.1.3
  - @evidence-dev/db-commons@0.1.2
  - @evidence-dev/bigquery@1.2.3
  - @evidence-dev/mysql@0.1.3
  - @evidence-dev/postgres@0.2.4
  - @evidence-dev/redshift@0.0.3
  - @evidence-dev/snowflake@0.1.4

## 1.1.7

### Patch Changes

- f16158e: Updated telemetry to include operating system
- 90b1846: Updates telemetry to include database type
- Updated dependencies [f16158e]
- Updated dependencies [90b1846]
  - @evidence-dev/telemetry@1.0.4

## 1.1.6

### Patch Changes

- e2383bb: Adding Redshift to the UI
- Updated dependencies [aa70947]
- Updated dependencies [e2383bb]
  - @evidence-dev/snowflake@0.1.3
  - @evidence-dev/redshift@0.0.2

## 1.1.5

### Patch Changes

- Updated dependencies [df25e4d]
  - @evidence-dev/telemetry@1.0.3

## 1.1.4

### Patch Changes

- Updated dependencies [8938e51]
  - @evidence-dev/postgres@0.2.3

## 1.1.3

### Patch Changes

- Updated dependencies [23d0234]
- Updated dependencies [7a87d0b]
  - @evidence-dev/bigquery@1.2.2
  - @evidence-dev/mysql@0.1.2
  - @evidence-dev/snowflake@0.1.2

## 1.1.2

### Patch Changes

- Updated dependencies [194de3a]
  - @evidence-dev/postgres@0.2.2
  - @evidence-dev/sqlite@1.1.2

## 1.1.1

### Patch Changes

- Updated dependencies [942488c]
  - @evidence-dev/db-commons@0.1.1
  - @evidence-dev/bigquery@1.2.1
  - @evidence-dev/mysql@0.1.1
  - @evidence-dev/postgres@0.2.1
  - @evidence-dev/snowflake@0.1.1
  - @evidence-dev/sqlite@1.1.1

## 1.1.0

### Minor Changes

- cb6d561: Native type support for MySQL, SQL Lite, and Snowflake and extracted common DB functionality to a shared package.

### Patch Changes

- Updated dependencies [cb6d561]
  - @evidence-dev/bigquery@1.2.0
  - @evidence-dev/db-commons@0.1.0
  - @evidence-dev/mysql@0.1.0
  - @evidence-dev/postgres@0.2.0
  - @evidence-dev/snowflake@0.1.0
  - @evidence-dev/sqlite@1.1.0

## 1.0.3

### Patch Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components
- Updated dependencies [1fead9d]
- Updated dependencies [f651bda]
  - @evidence-dev/bigquery@1.1.0
  - @evidence-dev/postgres@0.1.0
  - @evidence-dev/snowflake@0.0.9

## 1.0.2

### Patch Changes

- 44ebd1a: Update the telemetry settings panel to show the correct state on initial startup, and provide more environment variable friendly alternatives ("yes"/ "no") to opt out of telemetry in production.
- Updated dependencies [44ebd1a]
  - @evidence-dev/telemetry@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [8170b66]
  - @evidence-dev/telemetry@1.0.1

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- Updated dependencies [64daf72]
- Updated dependencies [3d0d93c]
- Updated dependencies [99c1d08]
- Updated dependencies [a50f8c2]
- Updated dependencies [1b81b58]
- Updated dependencies [644963c]
  - @evidence-dev/snowflake@0.0.8
  - @evidence-dev/sqlite@1.0.0
  - @evidence-dev/bigquery@1.0.0
  - @evidence-dev/telemetry@1.0.0

## 1.0.0-next.5

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- Updated dependencies [644963c]
  - @evidence-dev/bigquery@1.0.0-next.1
  - @evidence-dev/snowflake@0.0.8-next.1
  - @evidence-dev/sqlite@1.0.0-next.5
  - @evidence-dev/telemetry@1.0.0-next.1

## 1.0.0-next.4

### Patch Changes

- Updated dependencies [3d0d93c]
  - @evidence-dev/sqlite@1.0.0-next.4

## 1.0.0-next.3

### Patch Changes

- Updated dependencies [99c1d08]
  - @evidence-dev/sqlite@1.0.0-next.3

## 1.0.0-next.2

### Patch Changes

- Updated dependencies
  - @evidence-dev/sqlite@1.0.0-next.2

## 1.0.0-next.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/snowflake@0.0.8-next.0
  - @evidence-dev/sqlite@1.0.0-next.1

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- Updated dependencies
  - @evidence-dev/bigquery@1.0.0-next.0
  - @evidence-dev/sqlite@1.0.0-next.0
  - @evidence-dev/telemetry@1.0.0-next.0

## 0.1.18

### Patch Changes

- 09edb57: Add SQLite database connector
- Updated dependencies [09edb57]
  - @evidence-dev/sqlite@0.0.2
