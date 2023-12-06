# @evidence-dev/core-components

## 2.0.0-usql.19

### Patch Changes

- b4de6d55: Hint and Button styling updates
- 4d5735a2: UX and design updates to source configuration
- 88e1a5ee: Toasts can now be dismissable
- Updated dependencies [88e1a5ee]
  - @evidence-dev/component-utilities@2.0.0-usql.13
  - @evidence-dev/query-store@2.0.0-usql.7

## 2.0.0-usql.18

### Patch Changes

- 59938e50: SourceConfig handles missing plugins better
- 5247996b: Improved behavior when copying environment variables
- 6b7a132d: Fix chart & datatable error state
- 77d09b54: DataTable, Chart, Value all handle missing data prop better
- 77d09b54: BigValue handles missing data better
- 8f5d4ba8: Fix download button
- b1427173: QueryViewer is more reactive now; and cleaned up to leverage QueryStore more effectively
- Updated dependencies [b25a95d7]
- Updated dependencies [fe466b13]
  - @evidence-dev/component-utilities@2.0.0-usql.12
  - @evidence-dev/query-store@2.0.0-usql.6

## 2.0.0-usql.17

### Patch Changes

- 0e3eec13: Added <Button/>
- 0e3eec13: Cleaned up <Accordion/>, added a `small` prop
- 6eb93816: QueryViewer now respects QueryStore loading staet
  QueryViewer now updates when query text hmr updates

  QueryStore now accepts initialError when SSR query fails

  SSR / QueryStore now swallow errors unless build:strict is enabled
  (e.g. the error propogates to the UI where the user can more easily find it in dev mode / regular builds)

- 7c44653b: add error state to dropdowns, fix .clone() error, rename from prop to data
- 0e3eec13: Re-arranged environment variable UI
- 0e3eec13: Updated Toast notifications with more types and default options
- c8968ea3: Settings UI now creates a connector when testing, if it doesn't already exist. It also won't lock up in more cases
- Updated dependencies [6eb93816]
- Updated dependencies [7c44653b]
- Updated dependencies [0e3eec13]
- Updated dependencies [0e3eec13]
  - @evidence-dev/query-store@2.0.0-usql.5
  - @evidence-dev/component-utilities@2.0.0-usql.11

## 2.0.0-usql.16

### Patch Changes

- b5592a3f: Usability Improvements
  - @evidence-dev/query-store@2.0.0-usql.4

## 2.0.0-usql.15

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.3

## 2.0.0-usql.14

### Minor Changes

- 1097e5a9: add client ddb-backed dropdown component

### Patch Changes

- 130950d7: revamp toast notifications
- Updated dependencies [9bd1cd29]
- Updated dependencies [130950d7]
- Updated dependencies [1097e5a9]
- Updated dependencies [130950d7]
  - @evidence-dev/query-store@2.0.0-usql.2
  - @evidence-dev/component-utilities@2.0.0-usql.10

## 2.0.0-usql.13

### Patch Changes

- b6683ba0: Deploy screen now shows environment variables for USQL
- cad09993: improve source refresh experience
- 64d1405b: Loading state is now respected by Value and BigValue
- Updated dependencies [64d1405b]
  - @evidence-dev/component-utilities@2.0.0-usql.9
  - @evidence-dev/query-store@2.0.0-usql.1

## 2.0.0-usql.12

### Patch Changes

- 078fca3b: Error handling via QueryStores is more effective now
- e9a63c71: Add loading states to DataTable and Chart
- Updated dependencies [e1facffd]
- Updated dependencies [078fca3b]
- Updated dependencies [e9a63c71]
  - @evidence-dev/query-store@2.0.0-usql.0
  - @evidence-dev/component-utilities@2.0.0-usql.8

## 2.0.0-usql.11

### Patch Changes

- Updated dependencies [52e114cc]
- Updated dependencies [ca1f90b3]
  - @evidence-dev/component-utilities@2.0.0-usql.7

## 2.0.0-usql.10

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [7c4249c0]
- Updated dependencies [20127231]
  - @evidence-dev/component-utilities@2.0.0-usql.6
  - @evidence-dev/tailwind@1.0.0-usql.2

## 2.0.0-usql.9

### Patch Changes

- Updated dependencies [17a82581]
  - @evidence-dev/component-utilities@2.0.0-usql.5

## 2.0.0-usql.8

### Patch Changes

- Adjust icon usage, dependencies

## 2.0.0-usql.7

### Patch Changes

- Updated dependencies [f051417f]
  - @evidence-dev/tailwind@1.0.0-usql.1

## 2.0.0-usql.6

### Patch Changes

- Updated dependencies
  - @evidence-dev/component-utilities@2.0.0-usql.4

## 2.0.0-usql.5

### Patch Changes

- Updated dependencies [64ab3074]
  - @evidence-dev/component-utilities@2.0.0-usql.3

## 2.0.0-usql.4

### Patch Changes

- 9ade9c88: Add Definitions component
- 9432c6e4: limit `getFormatObjectFromString` in Value.svelte
- be1cc666: force NaN, null, and undefined to the top of ascending sort order and vice versa

## 1.2.0

### Minor Changes

- 78f2fab2: Adds modal, accordion and link button UI components

### Patch Changes

- 75560a31: Consolidate tailwind presets into tailwind package

## 2.0.0-usql.3

### Patch Changes

- Updated dependencies [e1174aa1]
  - @evidence-dev/component-utilities@2.0.0-usql.2

## 2.0.0-usql.2

### Minor Changes

- 78f2fab2: Adds modal, accordion and link button UI components

## 2.0.0-usql.1

### Patch Changes

- Updated dependencies [4053c976]
  - @evidence-dev/component-utilities@2.0.0-usql.1

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- 75560a31: Consolidate tailwind presets into tailwind package
- Updated dependencies [cb0fc468]
  - @evidence-dev/component-utilities@2.0.0-usql.0

## 1.1.0

### Minor Changes

- d999fe37: Consolidate all icons to steeze-ui and tabler icons
- 121c7868: Adds formatting control to components

### Patch Changes

- 4e94b57a: standardize exported date strings to ISO
- f6be30cf: Fix for grouped bar charts
- Updated dependencies [121c7868]
  - @evidence-dev/component-utilities@1.1.0

## 1.0.3

### Patch Changes

- 168af3bb: Add optional role and schema fields for snowflake
- 929a0074: fixes breadcrumb links, long breadcrumbs causing x-axis scrollbar, and bigvalue with object instead of array
- eb886615: switch to async + while loop to prevent requests building up

## 1.0.2

### Patch Changes

- 2b7809e6: added authenticator env var to listing, warning for browser-only auth

## 1.0.1

### Patch Changes

- 44c0c4ca: changed bigquery default connector
- a38148b5: Fixing the multi-line alert spacing

## 1.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

### Patch Changes

- ac3d47d3: fixes bugs preventing usage directly from npm
- 7873115f: Added lineColor prop to AreaChart
- d7d4dfce: Add prop to allow wrapping in datatable
- 84208c04: updated licenses, general cleanup
- Updated dependencies [ac3d47d3]
- Updated dependencies [4cd28cf5]
- Updated dependencies [84208c04]
  - @evidence-dev/component-utilities@1.0.0
  - @evidence-dev/tailwind@1.0.0
