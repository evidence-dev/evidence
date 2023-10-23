# @evidence-dev/core-components

## 2.1.1

### Patch Changes

- 9d5c11e1: move new layout libs from devdeps to deps

## 2.1.0

### Minor Changes

- 5f660a8d: Add box plot
- 56521bfb: Add value labels to charts
- 29ec9735: Log scale for y-axis
- 410c1bc6: Add custom color palette options to charts
- 9b8346f0: update core layout, tailwind config, align components to new layout, deprecate sticky alert
- 71a77ca6: Add secondary y-axis for line charts

### Patch Changes

- d09a32ce: Fix links to work in VS Code browser
- aafd7135: Consolidate echarts theme imports
- 75e419f8: Fix for axis settings when secondary axis enabled
- 548d37ff: fix regression from nullish linkLabel column fix
- e986ed77: Update print settings
- f8781d56: Fixes for reference area and histogram
- 1f20c79d: Minor adjustments
- e68a91f7: change error message for adapter import errors
- 614b9007: display null instead of linkLabel column name when row[column.linkLabel] is null
- 90258dec: Add showPercent option to funnel chart
- Updated dependencies [aafd7135]
- Updated dependencies [5f660a8d]
- Updated dependencies [56521bfb]
- Updated dependencies [9b8346f0]
- Updated dependencies [71a77ca6]
  - @evidence-dev/component-utilities@1.2.0
  - @evidence-dev/tailwind@1.1.0

## 2.0.4

### Patch Changes

- 1e2fad14: Bugfix: Copy-to-clipboard does not select DataTable Headers

## 2.0.3

### Patch Changes

- 5b5959f9: add databricks connector
- c2540d2f: Add support for Trino as a data source
- 7112f1b8: Fix y-axis labels being truncated on horizontal bar charts
- Updated dependencies [7112f1b8]
  - @evidence-dev/component-utilities@1.1.3

## 2.0.2

### Patch Changes

- 5d496a7b: Fix BarChart type inference

## 2.0.1

### Patch Changes

- 4944f21c: getCompletedData() fills all x values for categorical series
- 287126fe: Ensure that numeric and date x-axis series are sorted
- 9673d6a4: fix `ReferenceLine` and `ReferenceArea` reactivity
- 54060ffc: Add showAllXAxisLabels prop to BarChart
- Updated dependencies [4944f21c]
- Updated dependencies [287126fe]
  - @evidence-dev/component-utilities@1.1.2

## 2.0.0

### Major Changes

- acd0be37: updates sankey chart animation duration to match other charts.

### Minor Changes

- 883c9ebb: Adds delta content type to DataTable
- 86b94da9: Add colour scale conditional formatting to DataTable

### Patch Changes

- 798c0395: adds feature to have stepped line & area chart.
- cdbd1773: Add note to db connection settings panel
- ef3ec286: formatValue based on `data.y/xAxis` instead of `value` in ReferenceLine
- b9d54140: Added value prop alias for column to Value component
- 80594acd: adds invisible links to DataTable and USMap to allow sveltekit to prerender
- 5639ac12: Change details component styling, adds open prop
- 4ff7dcac: fixes deployment panel environment variables
- a1fa819e: bump vulnerable deps
- fc07d945: Updated style to enhance visibility of tabs and tab picker. And added a prop to customize background color of tab picker button.
- a00c7c76: Make Column component reactive to prop changes
- e7eb0ac2: Added CopyButton component
- Updated dependencies [16112191]
  - @evidence-dev/component-utilities@1.1.1

## 1.2.1

### Patch Changes

- 9ade9c88: Add Definitions component
- 9432c6e4: limit `getFormatObjectFromString` in Value.svelte
- be1cc666: force NaN, null, and undefined to the top of ascending sort order and vice versa

## 1.2.0

### Minor Changes

- 78f2fab2: Adds modal, accordion and link button UI components

### Patch Changes

- 75560a31: Consolidate tailwind presets into tailwind package

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
