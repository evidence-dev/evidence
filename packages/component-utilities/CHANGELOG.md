# @evidence-dev/component-utilities

## 2.0.0-usql.9

### Patch Changes

- 64d1405b: Loading state is now respected by Value and BigValue

## 2.0.0-usql.8

### Patch Changes

- 078fca3b: Error handling via QueryStores is more effective now
- e9a63c71: Add loading states to DataTable and Chart

## 2.0.0-usql.7

### Patch Changes

- 52e114cc: move date standardization
- ca1f90b3: Improved Logging

## 2.0.0-usql.6

### Patch Changes

- 7c4249c0: fix falsy dates in `convertColumnToDate`
- 20127231: Bump all versions so version pinning works

## 2.0.0-usql.5

### Patch Changes

- 17a82581: standardize date objects in `standardizeDateString`

## 2.0.0-usql.4

### Patch Changes

- Remove usql context; proper approach is to use page store now. Context is not reactive; and would require a store which is the behavior already present in \$app/stores.page

## 2.0.0-usql.3

### Patch Changes

- 64ab3074: Add USQL Context wrappers to component utilities

## 2.0.0-usql.2

### Patch Changes

- e1174aa1: added profile function to note load and query times

## 2.0.0-usql.1

### Patch Changes

- 4053c976: Fix custom formatting sometimes breaking when undefined

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

## 1.1.0

### Minor Changes

- 121c7868: Adds formatting control to components

## 1.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

### Patch Changes

- ac3d47d3: fixes bugs preventing usage directly from npm
- 84208c04: updated licenses, general cleanup
