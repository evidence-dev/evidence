# @evidence-dev/query-store

## 2.0.0-usql.3

### Patch Changes

- Updated dependencies [0ba78b67]
- Updated dependencies [cd57ba69]
  - @evidence-dev/universal-sql@2.0.0-usql.12

## 2.0.0-usql.2

### Patch Changes

- 9bd1cd29: remove old workaround with a merged fix
- 130950d7: add client/build time guardrails
- Updated dependencies [130950d7]
- Updated dependencies [52d81ce2]
  - @evidence-dev/universal-sql@2.0.0-usql.11

## 2.0.0-usql.1

### Patch Changes

- 64d1405b: Loading state is now respected by Value and BigValue

## 2.0.0-usql.0

### Major Changes

- e1facffd: Add QueryStore concept

  - Loads data as it is requested, rather than all at page-load / build
  - Uses duckdb to get data length / column data
  - Ties metadata, mutation queries, and data together to make component development easier
  - Provides information regarding loading (and query errors in the future)

### Patch Changes

- 078fca3b: Error handling via QueryStores is more effective now
