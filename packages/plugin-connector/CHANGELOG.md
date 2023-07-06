# @evidence-dev/plugin-connector

## 2.0.0-usql.1

### Patch Changes

- e6091323: chore: remove postinstall script

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- Updated dependencies [cb0fc468]
  - @evidence-dev/universal-sql@2.0.0-usql.0

## 1.1.0

### Minor Changes

- ed2f4728: allow for components folder to be used as a component plugin

## 1.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

### Patch Changes

- ac3d47d3: fixes bugs preventing usage directly from npm
- 84208c04: updated licenses, general cleanup
