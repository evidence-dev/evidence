# @evidence-dev/component-utilities

## 2.0.0-usql.21

### Patch Changes

- 5d280997: LocalStorageStores now flush values on update properly
- Updated dependencies [7a5225be]
  - @evidence-dev/query-store@2.0.0-usql.14

## 2.0.0-usql.20

### Patch Changes

- 71f0d481: Change default value for showing QueryViewers to include browser
- ef4155ee: echarts now replaces options rather than merging
- 583cea9e: Properly retrieve column types from QueryStores
- Updated dependencies [583cea9e]
  - @evidence-dev/query-store@2.0.0-usql.13

## 2.0.0-usql.19

### Patch Changes

- 4ac6a688: Add support for toasts without a timeout

## 2.0.0-usql.18

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.12

## 2.0.0-usql.17

### Patch Changes

- 982a17c6: Properly mute profiled functions when not in debug mode
  - @evidence-dev/query-store@2.0.0-usql.11

## 2.0.0-usql.16

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.10

## 2.0.0-usql.15

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.9

## 2.0.0-usql.14

### Patch Changes

- 6505351f: Misc Fixes
- Updated dependencies [840d1195]
- Updated dependencies [6064fbbf]
  - @evidence-dev/query-store@2.0.0-usql.8

## 2.0.0-usql.13

### Patch Changes

- 88e1a5ee: Toasts can now be dismissable
  - @evidence-dev/query-store@2.0.0-usql.7

## 2.0.0-usql.12

### Patch Changes

- b25a95d7: Misc fixes
- fe466b13: Added a localStorage backed store
  - @evidence-dev/query-store@2.0.0-usql.6

## 2.0.0-usql.11

### Patch Changes

- 7c44653b: add error state to dropdowns, fix .clone() error, rename from prop to data
- 0e3eec13: Updated Toast notifications with more types and default options
- 0e3eec13: Re-export steeze-ui icons from component utilities for easier access

## 2.0.0-usql.10

### Minor Changes

- 1097e5a9: add client ddb-backed dropdown component

### Patch Changes

- 130950d7: revamp toast notifications

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

## 1.2.2

### Patch Changes

- 3462a045: fix massive charts on ios

## 1.2.1

### Patch Changes

- 8ed2af44: Explicitly set font family for chart theme

## 1.2.0

### Minor Changes

- 5f660a8d: Add box plot
- 56521bfb: Add value labels to charts
- 9b8346f0: update core layout, tailwind config, align components to new layout, deprecate sticky alert
- 71a77ca6: Add secondary y-axis for line charts

### Patch Changes

- aafd7135: Consolidate echarts theme imports

## 1.1.3

### Patch Changes

- 7112f1b8: Fix y-axis labels being truncated on horizontal bar charts

## 1.1.2

### Patch Changes

- 4944f21c: getCompletedData() fills all x values for categorical series
- 287126fe: Ensure that numeric and date x-axis series are sorted

## 1.1.1

### Patch Changes

- 16112191: Fixes to series completion; duplicate series labels in timestamps should no longer appear

## 1.1.0

### Minor Changes

- 121c7868: Adds formatting control to components

## 1.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

### Patch Changes

- ac3d47d3: fixes bugs preventing usage directly from npm
- 84208c04: updated licenses, general cleanup
