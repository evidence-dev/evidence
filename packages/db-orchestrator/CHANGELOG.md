# @evidence-dev/db-orchestrator

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
