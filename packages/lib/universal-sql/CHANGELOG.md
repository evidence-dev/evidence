# @evidence-dev/universal-sql

## 2.2.10

### Patch Changes

- 64486c669: bump vitest
- Updated dependencies [64486c669]
  - @evidence-dev/sdk@3.0.9

## 2.2.9

### Patch Changes

- Updated dependencies [17eb07aff]
- Updated dependencies [bcb0bf5dd]
  - @evidence-dev/sdk@3.0.8

## 2.2.8

### Patch Changes

- Updated dependencies [243229f46]
  - @evidence-dev/sdk@3.0.7

## 2.2.7

### Patch Changes

- Updated dependencies [c7547d83f]
  - @evidence-dev/sdk@3.0.6

## 2.2.6

### Patch Changes

- Updated dependencies [f81376743]
  - @evidence-dev/sdk@3.0.5

## 2.2.5

### Patch Changes

- f416a339d: workaround bug in duckdb-wasm that errors when fully null date column is read as parquet
- Updated dependencies [309e27b51]
- Updated dependencies [730321d90]
  - @evidence-dev/sdk@3.0.4

## 2.2.4

### Patch Changes

- Updated dependencies [706963a42]
  - @evidence-dev/sdk@3.0.3

## 2.2.3

### Patch Changes

- Updated dependencies [2efb8df3e]
  - @evidence-dev/sdk@3.0.2

## 2.2.2

### Patch Changes

- Updated dependencies [288f87ec6]
  - @evidence-dev/sdk@3.0.1

## 2.2.1

### Patch Changes

- Updated dependencies [e2c95d172]
  - @evidence-dev/sdk@3.0.0

## 2.2.0

### Minor Changes

- d2ce60038: bump duckdb to 1.29.0, fix bugs emerging from that

### Patch Changes

- Updated dependencies [d2ce60038]
  - @evidence-dev/sdk@2.0.0

## 2.1.11

### Patch Changes

- Updated dependencies [b5a096723]
  - @evidence-dev/sdk@1.5.1

## 2.1.10

### Patch Changes

- Updated dependencies [b72e4a809]
  - @evidence-dev/sdk@1.5.0

## 2.1.9

### Patch Changes

- Updated dependencies [08923de11]
  - @evidence-dev/sdk@1.4.8

## 2.1.8

### Patch Changes

- Updated dependencies [00516897e]
- Updated dependencies [1de1eca52]
  - @evidence-dev/sdk@1.4.7

## 2.1.7

### Patch Changes

- Updated dependencies [c82ba1516]
  - @evidence-dev/sdk@1.4.6

## 2.1.6

### Patch Changes

- b2126ac1a: add --profile flag to sdk-handled cli commands, add debugging profiling and logs to build-parquet
- Updated dependencies [b2126ac1a]
  - @evidence-dev/sdk@1.4.5

## 2.1.5

### Patch Changes

- c0e1799e2: Set 644 permissions when writing parquet files

## 2.1.4

### Patch Changes

- 8c2982505: Update vitest to latest

## 2.1.3

### Patch Changes

- b84ef07ac: Add buildOptions.batchSize to connection.yaml spec
- 6cdedceb0: Remove db-orchestrator

## 2.1.2

### Patch Changes

- 7620a1af: removes unused duckdb dep
- a95db3d3: Move types to devDependencies

## 2.1.1

### Patch Changes

- 5e0bbf31: stop blocking advanced usage of json with usql

## 2.1.0

### Minor Changes

- ca3e593b: - Updated major dependencies (Svelte, SvelteKit, Vite) to improve memory usage when building

## 2.0.5

### Patch Changes

- 5a1e46a5: Fix for svelte vite errors
- 008cf432: Roll back proxy server
- 69b9ed32: Fix file imports for evidence package

## 2.0.4

### Patch Changes

- 57f71211: bump duckdb-wasm and arrow

## 2.0.3

### Patch Changes

- f4ccf03c: Add missing type

## 2.0.2

### Patch Changes

- e4e7d822: fix fully null boolean column with float64 conversion

## 2.0.1

### Patch Changes

- 913f5919: Handle null / undefined values when columns are omitted from result sets

## 2.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Minor Changes

- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering
- 52d81ce2: fix parameterized page prerendering

### Patch Changes

- aa34d0b3: Queries now wait for setParquetUrls, and will time out if they are not processed within 5 seconds
- 840d1195: allow initialdata to saturate columns
- b25a95d7: Misc fixes
- fd74bd3c: Prevent queries with the same name from different connectors from colliding
- 377abb4a: Rename databases -> datasources
- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- 0ba78b67: polish working with sources
- 2aaef5fb: Convoluted javascript things to fix convoluted javascript things
- 9603c4e7: Silence DuckDB unless in debug mode
- cb74406a: fix version mismatch and windows error
- b5592a3f: Usability Improvements
- bf4a112a: Update package.json to use new datasource field
- 69126c94: change internal filename generation
- 5928e45d: Reduce risk of queries attempting to execute prior to database initialization
- ca7337ba: fix prerendering for all pages
- cd57ba69: Add new interface for datasources for fine-grained control of output
- c4822852: Support for streaming results
- 52e114cc: move date standardization
- e173ca9d: Mute parquet url messages unless debug mode
- 4d5735a2: Fix a few fs related issues
- 26ad2d2c: When rebuilding and setting parquet urls, the duckdb internal filesystem is now cleaned up to force reloads
- ca4c3b00: Don't count the database as initialized until parquet urls are set (tables are created)
- 15248699: fix for hugeints
- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts
- 130950d7: add client/build time guardrails
- d1ab5e62: Bump ddb version
- 20127231: Bump all versions so version pinning works
- 9b1ac9b7: make everything use a single connection

## 2.0.0-usql.25

### Patch Changes

- e173ca9d: Mute parquet url messages unless debug mode

## 2.0.0-usql.24

### Patch Changes

- 15248699: fix for hugeints

## 2.0.0-usql.23

### Patch Changes

- 9603c4e7: Silence DuckDB unless in debug mode

## 2.0.0-usql.22

### Patch Changes

- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns

## 2.0.0-usql.21

### Patch Changes

- 2aaef5fb: Convoluted javascript things to fix convoluted javascript things

## 2.0.0-usql.20

### Patch Changes

- cb74406a: fix version mismatch and windows error
- d1ab5e62: Bump ddb version

## 2.0.0-usql.19

### Patch Changes

- Update package.json to use new datasource field

## 2.0.0-usql.18

### Patch Changes

- 377abb4a: Rename databases -> datasources

## 2.0.0-usql.17

### Patch Changes

- 840d1195: allow initialdata to saturate columns
- 26ad2d2c: When rebuilding and setting parquet urls, the duckdb internal filesystem is now cleaned up to force reloads

## 2.0.0-usql.16

### Patch Changes

- 4d5735a2: Fix a few fs related issues

## 2.0.0-usql.15

### Patch Changes

- b25a95d7: Misc fixes

## 2.0.0-usql.14

### Patch Changes

- fd74bd3c: Prevent queries with the same name from different connectors from colliding

## 2.0.0-usql.13

### Patch Changes

- b5592a3f: Usability Improvements

## 2.0.0-usql.12

### Patch Changes

- 0ba78b67: polish working with sources
- cd57ba69: Add new interface for datasources for fine-grained control of output

## 2.0.0-usql.11

### Minor Changes

- 52d81ce2: fix parameterized page prerendering

### Patch Changes

- 130950d7: add client/build time guardrails

## 2.0.0-usql.10

### Patch Changes

- Support for streaming results

## 2.0.0-usql.9

### Patch Changes

- 52e114cc: move date standardization

## 2.0.0-usql.8

### Patch Changes

- 20127231: Bump all versions so version pinning works

## 2.0.0-usql.7

### Patch Changes

- 69126c94: change internal filename generation

## 2.0.0-usql.6

### Patch Changes

- Queries now wait for setParquetUrls, and will time out if they are not processed within 5 seconds

## 2.0.0-usql.5

### Patch Changes

- Don't count the database as initialized until parquet urls are set (tables are created)

## 2.0.0-usql.4

### Patch Changes

- Reduce risk of queries attempting to execute prior to database initialization

## 2.0.0-usql.3

### Patch Changes

- ca7337ba: fix prerendering for all pages

## 2.0.0-usql.2

### Patch Changes

- 9b1ac9b7: make everything use a single connection

## 2.0.0-usql.1

### Minor Changes

- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering

### Patch Changes

- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).
