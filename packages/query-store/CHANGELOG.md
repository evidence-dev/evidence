# @evidence-dev/query-store

## 2.0.0-usql.7

### Patch Changes

- Updated dependencies [4d5735a2]
  - @evidence-dev/universal-sql@2.0.0-usql.16

## 2.0.0-usql.6

### Patch Changes

- Updated dependencies [b25a95d7]
  - @evidence-dev/universal-sql@2.0.0-usql.15

## 2.0.0-usql.5

### Patch Changes

- 6eb93816: QueryViewer now respects QueryStore loading staet
  QueryViewer now updates when query text hmr updates

  QueryStore now accepts initialError when SSR query fails

  SSR / QueryStore now swallow errors unless build:strict is enabled
  (e.g. the error propogates to the UI where the user can more easily find it in dev mode / regular builds)

- Updated dependencies [fd74bd3c]
  - @evidence-dev/universal-sql@2.0.0-usql.14

## 2.0.0-usql.4

### Patch Changes

- Updated dependencies [b5592a3f]
  - @evidence-dev/universal-sql@2.0.0-usql.13

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
