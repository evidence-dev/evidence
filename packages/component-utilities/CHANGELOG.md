# @evidence-dev/component-utilities

## 2.3.0

### Minor Changes

- e09c5716: Add empty state to components

### Patch Changes

- 6ec752a7: Fix custom formatting retrieval for custom components
- b864b3cd: Add additional echarts override options to charting library

## 2.2.1

### Patch Changes

- 6a61ea17: - buildReactiveInputQuery was accidentally setting the value of it's store to a Promise, which was not the intent. This ensures that the value is always the proper interface.

## 2.2.0

### Minor Changes

- 0f42e927: Add Heatmap and CalendarHeatmap components

### Patch Changes

- 9176c2cc: Added buildReactiveInputQuery for ensuring input query values are reactive
  - @evidence-dev/query-store@2.0.3

## 2.1.0

### Minor Changes

- c25fc1ac: Upgraded USMap component

### Patch Changes

- f7903b86: Update downloaded filenames
- cd9c80b2: Moved chart helper contexts from core-components to component utilites so they are accessible to 3rd party plugins
- fa0faf8c: Fix treatment of nulls in getCompletedData helper function
- a6de89de: Adds option to include total rows in DataTables
  - @evidence-dev/query-store@2.0.2

## 2.0.2

### Patch Changes

- 03b3b626: Added TextInput and ButtonGroup (+ DateAgg) input components

## 2.0.1

### Patch Changes

- 913f5919: getCompletedData handles dates properly now
  - @evidence-dev/query-store@2.0.1

## 2.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Minor Changes

- 1097e5a9: add client ddb-backed dropdown component

### Patch Changes

- 4ac6a688: Add support for toasts without a timeout
- 5d280997: LocalStorageStores now flush values on update properly
- 391282e5: QueryStore now uses a factory pattern to enforce caching
- b25a95d7: Misc fixes
- 71f0d481: Change default value for showing QueryViewers to include browser
- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- 7c4249c0: fix falsy dates in `convertColumnToDate`
- e1174aa1: added profile function to note load and query times
- 7c44653b: add error state to dropdowns, fix .clone() error, rename from prop to data
- 130950d7: revamp toast notifications
- bf4a112a: Update package.json to use new datasource field
- 17a82581: standardize date objects in `standardizeDateString`
- ef4155ee: echarts now replaces options rather than merging
- 489a6069: Make echarts animation time forced to be 500ms
- 88e1a5ee: Toasts can now be dismissable
- 64ab3074: Add USQL Context wrappers to component utilities
- 078fca3b: Error handling via QueryStores is more effective now
- 52e114cc: move date standardization
- 9e7ba37d: Remove usql context; proper approach is to use page store now. Context is not reactive; and would require a store which is the behavior already present in \$app/stores.page
- fe466b13: Added a localStorage backed store
- ca1f90b3: Improved Logging
- 982a17c6: Properly mute profiled functions when not in debug mode
- 583cea9e: Properly retrieve column types from QueryStores
- 4053c976: Fix custom formatting sometimes breaking when undefined
- 6505351f: Misc Fixes
- 20127231: Bump all versions so version pinning works
- e9a63c71: Add loading states to DataTable and Chart
- 64d1405b: Loading state is now respected by Value and BigValue
- 0e3eec13: Updated Toast notifications with more types and default options
- 0e3eec13: Re-export steeze-ui icons from component utilities for easier access
- Updated dependencies [391282e5]
- Updated dependencies [840d1195]
- Updated dependencies [6064fbbf]
- Updated dependencies [6eb93816]
- Updated dependencies [9bd1cd29]
- Updated dependencies [120d22e9]
- Updated dependencies [bf4a112a]
- Updated dependencies [e1facffd]
- Updated dependencies [f38b8920]
- Updated dependencies [e2162851]
- Updated dependencies [078fca3b]
- Updated dependencies [f764cba4]
- Updated dependencies [583cea9e]
- Updated dependencies [130950d7]
- Updated dependencies [043a302a]
- Updated dependencies [16a17086]
- Updated dependencies [4c6eae53]
- Updated dependencies [64d1405b]
- Updated dependencies [7a5225be]
- Updated dependencies [ba0d6f50]
  - @evidence-dev/query-store@2.0.0

## 2.0.0-usql.32

### Patch Changes

- Updated dependencies [f38b8920]
  - @evidence-dev/query-store@2.0.0-usql.24

## 2.0.0-usql.31

### Patch Changes

- Updated dependencies [043a302a]
  - @evidence-dev/query-store@2.0.0-usql.23

## 2.0.0-usql.30

### Patch Changes

- 489a6069: Make echarts animation time forced to be 500ms

## 2.0.0-usql.29

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.22

## 2.0.0-usql.28

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.21

## 2.0.0-usql.27

### Patch Changes

- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.20

## 2.0.0-usql.26

### Patch Changes

- Updated dependencies [e2162851]
  - @evidence-dev/query-store@2.0.0-usql.19

## 2.0.0-usql.25

### Patch Changes

- 391282e5: QueryStore now uses a factory pattern to enforce caching
- Updated dependencies [391282e5]
  - @evidence-dev/query-store@2.0.0-usql.18

## 2.0.0-usql.24

### Patch Changes

- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.17

## 2.0.0-usql.23

### Patch Changes

- Updated dependencies [16a17086]
  - @evidence-dev/query-store@2.0.0-usql.16

## 2.0.0-usql.22

### Patch Changes

- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- Updated dependencies [4c6eae53]
- Updated dependencies [ba0d6f50]
  - @evidence-dev/query-store@2.0.0-usql.15

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
