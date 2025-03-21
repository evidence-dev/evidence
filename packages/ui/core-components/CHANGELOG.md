# @evidence-dev/core-components

## 5.2.1

### Patch Changes

- b68cba4c8: Fixes issue where clicking a table row link with openInNewTab=true did not actually open the link in a new tab
- 4784cc4ef: Update Date Range presets with new options

  Month to Today & Year to Today - to end on the last available date of the data used

- 356eca8e9: Fix Basemap rendering when used with inputs
- a0fcca759: Fix height prop in maps
- 72a635815: Fix Column scaleColor not being used

## 5.2.0

### Minor Changes

- 7713d3e73: Improved settings page UI

### Patch Changes

- 64486c669: bump vitest
- 4efd427a7: Use theme class instead of data-
- 656543815: Dont hide entire kebab menu when neverShowQueries is true
- Updated dependencies [254a90551]
- Updated dependencies [64486c669]
- Updated dependencies [4efd427a7]
  - @evidence-dev/tailwind@3.0.9
  - @evidence-dev/component-utilities@4.0.9

## 5.1.2

### Patch Changes

- 17eb07aff: Override nanoid to 3.3.8
- 9179782aa: Fix axis line appearance in sparklines
- bcb0bf5dd: Update vite to 5.4.14
- 59d6755a8: Fix mobile usage issue for Info component
  - @evidence-dev/component-utilities@4.0.8
  - @evidence-dev/tailwind@3.0.8

## 5.1.1

### Patch Changes

- c3ff5614e: fixed US map abbreviaabbreviations string handling
- 0910a522c: fixed legend false prop to respect strings
- acef0cfae: fixed deselection issue for start and end date
- e91eed30c: added informative error handling for data and required props in core-components
- e93254909: updated components to properly evaluate string true and false props
- 411fc0a16: fixed slider delay with large min max value difference
- fcbe2dfb3: Add ignoreZoom option to maps
  - @evidence-dev/component-utilities@4.0.7
  - @evidence-dev/tailwind@3.0.7

## 5.1.0

### Minor Changes

- 2e506cdad: Chart upgrades and spacing improvements

### Patch Changes

- 27bca8e8e: Add print behavior for components with hidden content
- d97a4ce94: Add Info component
- f30d3ee5c: Add simple wrapper components for common HTML usgae
  - @evidence-dev/component-utilities@4.0.6
  - @evidence-dev/tailwind@3.0.6

## 5.0.5

### Patch Changes

- @evidence-dev/component-utilities@4.0.5
- @evidence-dev/tailwind@3.0.5

## 5.0.4

### Patch Changes

- 0d6e938f4: fixed border regression in dateinput
- 9324590f8: fixed downloadable image and data prop
- 4e1829b38: Adjust spacing on mobile header
- 700ea77f8: replace deprecated colors
- b28d4cf25: Bug fix: mute the color of badges in multi-selects.
- 1190af0f0: Update default layout
- 8b8965525: Restyle Tabs component
- 1dceaa2e0: Fix case sensitivity of sort in DataTable
- 4d6d41dde: Expand click targets in sidebar level 3
- c63773aa4: fixes print preview in dark mode
- b058d924c: Removes console log
- 87ee3d66c: Add third level pages to sidebar
- 5ab144e70: Title and subtitle consistency across components
- e6fa72acd: Minor styling updates
- eda30637a: Remove groupDataPopulated flag
- 70cb324ae: Styling changes for consistency
- Updated dependencies [730321d90]
  - @evidence-dev/component-utilities@4.0.4
  - @evidence-dev/tailwind@3.0.4

## 5.0.3

### Patch Changes

- a9edd3377: Feature: DateInput - supports single and ranged calendar date inputs
- d8d7b456f: fix ssr'd defaultValue usage with DateRange
- b1aa2410e: fixed datatable wraptitle alignment issue
- 1a6a3568a: USMap and Column default colorScale is default
- b92827ff6: Add lightLogo and darkLogo props to EvidenceDefaultLayout to show different custom logos in light/dark mode
- 0b90a34f9: Improvments to ErrorChart
- ee52c8188: Adds a 'Last 365 days' option to defaultValues
- 0f09fff03: Sparkline tooltip theming
- 706963a42: Upgrade nanoid to 5.0.9
  - @evidence-dev/component-utilities@4.0.3
  - @evidence-dev/tailwind@3.0.3

## 5.0.2

### Patch Changes

- Updated dependencies [6115376f6]
  - @evidence-dev/tailwind@3.0.2
  - @evidence-dev/component-utilities@4.0.2

## 5.0.1

### Patch Changes

- @evidence-dev/component-utilities@4.0.1
- @evidence-dev/tailwind@3.0.1

## 5.0.0

### Major Changes

- e2c95d172: Theming & Appearances

### Patch Changes

- Updated dependencies [e2c95d172]
- Updated dependencies [e2c95d172]
  - @evidence-dev/component-utilities@4.0.0
  - @evidence-dev/tailwind@3.0.0
  - @evidence-dev/icons@1.0.2

## 4.9.2

### Patch Changes

- @evidence-dev/component-utilities@3.2.23
- @evidence-dev/tailwind@2.1.12

## 4.9.1

### Patch Changes

- 4d1ecd921: series names can be formatted in Area, Bar, Bubble, Line charts and Scatter plot
- 1f343b638: fixed table header chevron layout shift
- b3465c45d: Upgrade @sveltejs/kit to 2.8.4
  - @evidence-dev/component-utilities@3.2.22
  - @evidence-dev/tailwind@2.1.11

## 4.9.0

### Minor Changes

- b72e4a809: Remove plugin connector

### Patch Changes

- 58f537d79: Align the height of buttongroup to dropdown
- 9c1ad71a1: fixed dataTable not displaying sorted data
  - @evidence-dev/component-utilities@3.2.21
  - @evidence-dev/tailwind@2.1.10

## 4.8.13

### Patch Changes

- 62afe741b: Node 22 support
- Updated dependencies [62afe741b]
  - @evidence-dev/component-utilities@3.2.20
  - @evidence-dev/tailwind@2.1.9

## 4.8.12

### Patch Changes

- 6938c07d0: Added support for deployment.basePath
- 4ca8cb14a: removed skeleton for annotation components, fixes double skeletons for annotation usage
- 61342f41e: Updated core components for docTabs
- Updated dependencies [0c538ac70]
  - @evidence-dev/component-utilities@3.2.19
  - @evidence-dev/tailwind@2.1.8

## 4.8.11

### Patch Changes

- 6ecef713f: Fixed Error Chart layering, updated Maps errorchart handling
- 7a414e88e: fix daterange flickering, slider default
- ddf5da4d0: fix map loading state layout shift
- 320c39941: fixed string handling for slider prop values
- 475c42432: Adds attribution prop to maps and documents how to use it.
- 7f70975e5: Add bluesky logo to options for header
- c17626b1c: Allows customization of the name of the Home page in the sidebar
- 667b7167e: Slider accepts dynamic default and max min values from data
- 58403f1db: delete columns from prop listing when they're destroyed
- 4e240652b: Add seriesOrder parameter to allow users to specify a specific order the series are displayed in (fixes #2663)
- Updated dependencies [4e240652b]
  - @evidence-dev/component-utilities@3.2.18
  - @evidence-dev/tailwind@2.1.7

## 4.8.10

### Patch Changes

- e5aa2ccf2: Remove Flowchart component and mermaid dependency
- 8e8f43d3e: Add a fmt option to dimension grid
- e3b920690: Modified Last x Days selectors in the DateRange component so they select x days instead of x + 1 days
- b9b51a0b2: fix transition animation in charts
- 2ad93ef1d: Prevent CLS when highlighting codeblocks

## 4.8.9

### Patch Changes

- cc086aa50: Add sort prop to DataTable
- c44853b3f: fixed bubbles + points layering issue
- eec98520a: Add sparkline and bar viz to DataTable
- 76dda50ae: Fixes layering issue and allows for layering control of bubbles and points
- 795f53653: Improved Map Legends, added multi-legends in basemap
  - @evidence-dev/component-utilities@3.2.17
  - @evidence-dev/tailwind@2.1.6

## 4.8.8

### Patch Changes

- a94ca734d: add \_\_renderCount hidden property on charts plus testids and aria-labels for accessibility/test targets
- Updated dependencies [a94ca734d]
  - @evidence-dev/component-utilities@3.2.16
  - @evidence-dev/tailwind@2.1.5

## 4.8.7

### Patch Changes

- 163ff7a33: Disable windows cache service worker with VITE_EVIDENCE_DISABLE_WINDOWS_CACHE_SERVICE_WORKER

## 4.8.6

### Patch Changes

- Updated dependencies [2b5d759f1]
  - @evidence-dev/component-utilities@3.2.15

## 4.8.5

### Patch Changes

- 1cc64f83f: Table rows with links preload data on hover
  Table rows with links have a chevron icon on the right side
  Table rows dont have link styling if the link value is falsey
- 101d58f09: Implemented categorical and scalar map legends

## 4.8.4

### Patch Changes

- 024e93b02: Defer selectAll=false to ensure that all options are available before the behavior is turned off

## 4.8.3

### Patch Changes

- e0abcc56d: Add yellow tint to queries with unresolved inputs in the devtools
- 0feacbbe5: ySet is now reactive, enabling better support for dynamic y columns
  - @evidence-dev/component-utilities@3.2.14
  - @evidence-dev/tailwind@2.1.4

## 4.8.2

### Patch Changes

- eec16e59d: Add Group component for Grids
- 57c118c16: fixes reactive DataTable columns
- 952abbd16: DropdownMenuItem has cursor-pointer
  Create theme stores to manage theme
  Add appearance toggle to KebabMenu (hidden behind VITE_EVIDENCE_THEMES=true)
  Show/Hide queries and Appearance in KebabMenu dont close menu when clicked
- c8315da2e: Update svelte to resolve security vulnerability
- 06313c848: fix prerendered arrow files not loading
- Updated dependencies [952abbd16]
- Updated dependencies [c8315da2e]
  - @evidence-dev/tailwind@2.1.3
  - @evidence-dev/component-utilities@3.2.13

## 4.8.1

### Patch Changes

- b87d90971: Fix dev tools keybind on windows
  - @evidence-dev/component-utilities@3.2.12

## 4.8.0

### Minor Changes

- 999fffa38: Change input store interactions

### Patch Changes

- 999fffa38: Modal emits an event when closed now
- 999fffa38: Pull prop listing into a component for reusabilitiy
- 67dbd116b: Adds support for Multiline strings as source config
  Moves snowflake private key to multi-line string field
- 999fffa38: Add compact prop to accordion
- 999fffa38: Add maxWidth and direction props to hints
  - @evidence-dev/component-utilities@3.2.11

## 4.7.8

### Patch Changes

- 33dee6b35: fixed boxplot duplicates
- d6d64147d: selected tabs with id prop selection persist on refresh/link shared
- f34ddbae9: added default values for queries in button groups
- Updated dependencies [221e4261b]
  - @evidence-dev/component-utilities@3.2.10

## 4.7.7

### Patch Changes

- 2e0115932: Funnel chart's showPercent param should calculate based upon initial value, not total
- 5daf7675e: Reverts tab styling for Buttongroup, which broke Tabs

## 4.7.6

### Patch Changes

- fa621ad18: Added DataTable Fullscreen y-scroll, added Fullscreen height calc to include search bar height
- 9ea566854: SelectAllByDefault conditionally checks for strings + booleans
- 57be334fe: Added button groups with tab styles prop

## 4.7.5

### Patch Changes

- 06bb5f369: Add skeleton loading state for Area Map, Bubble Map, and Point Map
- 8c2982505: - Switch to perfect-debounce instead of lodash.debounce
  - Remove all lodash.library in favor of better supported lodash/library
- 99410c144: feat: AreaMap and Areas react to geoJsonUrl changes
- 67a94f6f9: Fixed Home Breadcrumbs href
- 8c2982505: Rewrite Dropdown + DropdownOptionStore
- 050707ba9: Dropdown has role "combobox" not "combo-box"
- 8c2982505: Update vitest to latest
- 2a2d0d914: removed scroll to top and fixed esc close for fullscreen mode
- 4033c0b6e: Smooth zoom feature for maps
- 2527838c4: Fix TProtocolException when loading Parquet files on Windows
- c0c44330b: Added multiple selections to Dimension Grid
- 4b0c088fd: Removes max height from codeblocks
- Updated dependencies [8c2982505]
  - @evidence-dev/component-utilities@3.2.9

## 4.7.4

### Patch Changes

- 32035eeaa: Override fast-xml-parser version to >=4.4.1 to resolve vulnerability
- 6ff0e92b8: Adds option to disable downloads for data and/or images from charts
- Updated dependencies [32035eeaa]
  - @evidence-dev/tailwind@2.1.2
  - @evidence-dev/component-utilities@3.2.8

## 4.7.3

### Patch Changes

- f8e76c7d9: changed tabs inactive border styling
- 8782d9e95: added boxplot stories
- 5922269dc: Allows using total labels without series labels
- 4ae4427ea: Updated Value component's props for conditional color rendering
- 318196074: Fixed char by char search, search by filteredCols, fixed out of bounds pagination
  - @evidence-dev/component-utilities@3.2.7

## 4.7.2

### Patch Changes

- 3698967f1: References wait for data before updating ECharts config

## 4.7.1

### Patch Changes

- @evidence-dev/component-utilities@3.2.6

## 4.7.0

### Minor Changes

- 731d0bb06: Refactor ReferenceLine and ReferenceArea to use a store, add additional styling props
- 7cb558c32: allow for dynamic breadcrumbs via frontmatter

### Patch Changes

- 08818477d: Dropdown can have option with null value/label
- 0558bae48: updated checkbox stories
- f5decad6b: Added CalendarHeatmap Stories
- ee8f135ac: Fix font styling props for ReferenceLine/ReferenceArea
  - @evidence-dev/component-utilities@3.2.5

## 4.6.2

### Patch Changes

- a2f9bfb7a: Fix dropdown selection

## 4.6.1

### Patch Changes

- a5b141dec: Enable strict mode
- c392866a0: added bubblechart stories
- 6754944ca: Dont use a date in Dropdown story to enable UI testing
- e6aa2021d: Updated Dimension grid take in queries with spaces
- 6d2a194e6: Fix Dropdown query-based default value performance and race conditions

## 4.6.0

### Minor Changes

- 0b4ae10c5: Add ReferencePoint and Callout components

### Patch Changes

- dbc4116e3: updated link component stories and docs
- 42ca6d4ce: Remove non-functional labelVisible prop from ReferencePoint and Callout

## 4.5.4

### Patch Changes

- cb3f17c9e: Fix reactively updating ReferenceLine x/y value
- 1009026e8: Fix regression in Tabs where label always overrides id
- 3a1e1d664: Fix dynamically generated tabs from a query
  - @evidence-dev/component-utilities@3.2.4

## 4.5.3

### Patch Changes

- @evidence-dev/component-utilities@3.2.3

## 4.5.2

### Patch Changes

- 0bb7718a2: Added url prop to Big value Component
- d6b25b02c: Fix source query triggering HMR on the page
- 6cdedceb0: Remove db-orchestrator
- df9159f2b: Added a new <QueryDebugger/> component to ease investigation into which queries have run on the page
- 9982970fd: Support dynamic title inputs in accordions
- Updated dependencies [6cdedceb0]
  - @evidence-dev/component-utilities@3.2.2
  - @evidence-dev/icons@1.0.1
  - @evidence-dev/tailwind@2.1.1

## 4.5.1

### Patch Changes

- c10e35be1: Updated Running EvalDefault Condition to wait for option store to be populated
- 08d7b9405: Fix weighted mean behavior
  - @evidence-dev/component-utilities@3.2.1

## 4.5.0

### Minor Changes

- b041f5f9a: updated camelCase acceptance for presetRanges prop, created default value prop for dateRange

### Patch Changes

- f411c8650: added datatable to add in ' when it contains a space
- 79f4758e0: Fix stale pagination where current page extends beyond pageCount after a filter change
- Updated dependencies [010424745]
  - @evidence-dev/icons@1.0.0

## 4.4.0

### Minor Changes

- 2523e5f1: Value component now accepts agg prop

### Patch Changes

- 9fdc805b: DateRange uses QueryLoad + Skeleton to have a proper loading state
- 97cb3a7c: Handle all-null x columns in Line.svelte
- e058d2d3: Dropdown Index was returning NaN for all non-search queries
- 73fc7ebf: Add ordinal functionality to buildInputQuery and withOrdinal to Query - leverage this in Dropdown to maintain user-specified sorting until search is activated
- 8f374326: updated dropdown select all function for non-query options
- f6b22bbc: Dropdown behavior when using selectAllByDefault improved
- a24deaf0: Dropdown now sorts using label before value
- 106222df: - startingZoom is now respected more consistently in Map.svelte
  - startingZoom does not need to specified with startingLat/Long, and can be used independently
  - zoomSnap has been modified to allow finer control over the zoom level
- 90f381dc: Dropdown option store uses sharedPromise to handle concurrency / races better. Select operations now wait for options to settle (all pending adds/removes must finish first), Add / Removes now wait for flags to finish
- a2af0bea: DateRange now waits for the query to resolve, if one is available
- 106222df: Mitigated white lines appearing in map
- Updated dependencies [3d1c42e0]
- Updated dependencies [acba0f3a]
  - @evidence-dev/component-utilities@3.2.0

## 4.3.0

### Minor Changes

- f8f7ebdb: Added sorting for numerical options in dropdop

### Patch Changes

- 064a5c96: Add optional title slot to Accordian Items
- 54546362: Adjust DownloadData component for general use
- 9dd69149: Fix auto-casing on tooltip titles
- ac0df6ca: Fix Prism imports in CodeBlock
- Updated dependencies [737642a0]
  - @evidence-dev/component-utilities@3.1.0

## 4.3.0-features-b.6

### Patch Changes

- a24deaf04: Dropdown now sorts using label before value

## 4.3.0-features-b.5

### Patch Changes

- e058d2d35: Dropdown Index was returning NaN for all non-search queries

## 4.3.0-features-b.4

### Patch Changes

- 9fdc805b5: DateRange uses QueryLoad + Skeleton to have a proper loading state

## 4.3.0-features-b.3

### Patch Changes

- 90f381dc1: Dropdown option store uses sharedPromise to handle concurrency / races better. Select operations now wait for options to settle (all pending adds/removes must finish first), Add / Removes now wait for flags to finish
- a2af0beaf: DateRange now waits for the query to resolve, if one is available

## 4.3.0-features-b.2

### Patch Changes

- 73fc7ebfe: Add ordinal functionality to buildInputQuery and withOrdinal to Query - leverage this in Dropdown to maintain user-specified sorting until search is activated

## 4.3.0-features-b.1

### Minor Changes

- f8f7ebdbc: Added sorting for numerical options in dropdop

### Patch Changes

- 064a5c96e: Add optional title slot to Accordian Items
- 9dd691497: Fix auto-casing on tooltip titles

## 4.2.1-features-b.0

### Patch Changes

- 97cb3a7c3: Handle all-null x columns in Line.svelte
- f6b22bbce: Dropdown behavior when using selectAllByDefault improved
- 106222df8: - startingZoom is now respected more consistently in Map.svelte
  - startingZoom does not need to specified with startingLat/Long, and can be used independently
  - zoomSnap has been modified to allow finer control over the zoom level
- 106222df8: Mitigated white lines appearing in map
- Updated dependencies [acba0f3a6]
  - @evidence-dev/component-utilities@3.0.5-features-b.0

## 4.2.0

### Minor Changes

- 1377e0ed: Interactive map components
- 6157db9a: Add checkbox component

### Patch Changes

- 2a396873: Adding a selectAllByDefault property to Dropdowns
- 40c83ee2: Fix BigValue downIsGood
  - @evidence-dev/component-utilities@3.0.4

## 4.1.1

### Patch Changes

- b3e10dac: Added loading state to ButtonGroup to prevent layout shifts while Query is executing
- a6414446: $slots.\_error is not $slots.error
- e400971e: TextInput now respects Unset more effectively
- 52b3fde1: - Dropdown no longer renders a skeleton
  - Dropdown ensures that only one options subscription exists at a time to prevent over-evaluating defaults
- Updated dependencies [43d66875]
  - @evidence-dev/component-utilities@3.0.3

## 4.1.0

### Minor Changes

- 1e1486f3: Dropdown component overhaul, see #1944
- 1e1486f3: Created new input proxy, added tests, converted to use this instead of existing in-place proxy + detection method
- dd0dbc16: add show/hide/never sidebar toggle in frontmatter

### Patch Changes

- 9e0f10cc: Fix ReferenceLine and ReferenceArea reactivity
- 3f6975af: Fix reactivity in Sparklines
- f4d9b336: Improve responsiveness of button groups
- 3f53e809: Add syntax highlighting to code blocks
- 53f7bd14: Add additional date range presets to DateRange input component
- abae3ed9: Renamed all instances of `container` class to prevent collisions with tailwind container
- 30c942b1: fix: DataTable pagination input box width overflow
- cafc814b: Adds support for a more compact table view that allows more content vertically and horizontally
- 51dd57fb: Fix Details component open option
- b0539005: Add loading state to `DateRange`
- 564f3444: fix minor bugs in queryload/querystore/preprocess, add strict cast to daterange
- 71dabb41: Fix errors caused by formatting null table columns
- 9e8f8b1a:
- 7f85e600: version bumps
- Updated dependencies [1e1486f3]
- Updated dependencies [85d01792]
  - @evidence-dev/component-utilities@3.0.2

## 4.0.2

### Patch Changes

- 41a9f1b5: Reintroduce error handling to DataTable
- 0a67d65e: fix: calendar heatmap off by 1 error
- 63908810: Fix scrollbar appearing on last chart on page
- 09b999d5: Update Evidence Cloud link in Settings

## 4.0.1

### Patch Changes

- cb6db1a1: Fix for Query not respecting noResolve properly
  Skeleton slot for QueryLoad was not properly passing the "loaded" slot prop
  - @evidence-dev/component-utilities@3.0.1

## 4.0.0

### Major Changes

- 64a54b56: Use the new Query from the SDK package

### Minor Changes

- d2e44015: Converted QueryLoad to use only sdk Query

### Patch Changes

- 2a7f0fc2: support 0 as a sidebar_position
- a27de58e: Fix css styling for markdown link headers
- 6f72d476: Add conditional formatting based on another column, and red negative values
- a95db3d3: Move types to devDependencies
- Updated dependencies [64a54b56]
- Updated dependencies [d23b166c]
  - @evidence-dev/component-utilities@3.0.0

## 3.8.0

### Minor Changes

- 9bac016c: add `noDefault` prop to `Dropdown`, support for multi-defaultValue

### Patch Changes

- e1e9a068: Add automatic links to headers
- 505f121b: Adds support for HTML contentType in DataTables
- 5098c3ee: Fixes bold, italic, strikethrough and code span sizing issues in markdown
- Updated dependencies [629f93a0]
  - @evidence-dev/component-utilities@2.5.3
  - @evidence-dev/query-store@2.1.2

## 3.7.3

### Patch Changes

- fab378cb: Fix for bigvalue loaded is undefined

## 3.7.2

### Patch Changes

- be3085ce: Fix printing of charts in grid component
- 32af67c5: Custom conditional color scales for DataTable
- 94156598: Wrap column titles for DataTable
- 75f30e70: Fix null handling with custom formatting in Delta
- Updated dependencies [3a91fdc1]
  - @evidence-dev/query-store@2.1.1
  - @evidence-dev/component-utilities@2.5.2

## 3.7.1

### Patch Changes

- 8b636a62: Adjust delta neutral symbol
- 24cec2ec: Fix column order issue in DataTable when Column used

## 3.7.0

### Minor Changes

- 4f918c71: add `Select all` option to `Dropdown`s, add dropdowns to `DateRange` for easier year selection

### Patch Changes

- 58880cc9: Fix errors caused by formatting null values
- d3847df4: Adjust scatter hover to focus on individual point
- aa5708f0: Add support for connected charts
- d97d75e6: Add table groups and standalone Delta component
- 8efccce0: Fix map image download
- dbf8db42: Add options to Evidence layout
- Updated dependencies [aa5708f0]
- Updated dependencies [8efccce0]
  - @evidence-dev/component-utilities@2.5.1

## 3.6.1

### Patch Changes

- 73421976: upgrade svelte deps

## 3.6.0

### Minor Changes

- 5b12c2a9: add `Fullscreen` component and use it in `DataTable`
- 6b475bf6: adds `default` prop to `ButtonGroupItem`s allowing for a default selected item
- ca3e593b: - Updated major dependencies (Svelte, SvelteKit, Vite) to improve memory usage when building

### Patch Changes

- a9cf5c1a: Right align metric labels in dimension grid
- cb669665: Adjust default margin on input components
- 029c9f32: fix single row `Value` and `BigValue` regressions
- 76be235f: remove `Fuse` from running on the server and `convertColumnToDate` from running on date columns
- 705a1a9f: Make query error messages copyable
- 67b14c20: Remove right margin on header
- Updated dependencies [f9fe4d89]
- Updated dependencies [ca3e593b]
- Updated dependencies [089a08e4]
- Updated dependencies [e3cf9809]
  - @evidence-dev/component-utilities@2.5.0
  - @evidence-dev/query-store@2.1.0
  - @evidence-dev/tailwind@2.1.0

## 3.5.2

### Patch Changes

- b50ec639: Adjusts multi-dropdowns to return ARRAY rather than LIST types
- 9a9ace8f: fix features/a regressions involving initialData and Dropdowns
- dcbc0580: Maxwidth option to layout, bug fixes
- Updated dependencies [9a9ace8f]
  - @evidence-dev/query-store@2.0.6
  - @evidence-dev/component-utilities@2.4.2

## 3.5.1

### Patch Changes

- 5a1e46a5: Fix for svelte vite errors
- 008cf432: Roll back proxy server
- 69b9ed32: Fix file imports for evidence package
- Updated dependencies [5a1e46a5]
- Updated dependencies [008cf432]
- Updated dependencies [69b9ed32]
  - @evidence-dev/component-utilities@2.4.1
  - @evidence-dev/query-store@2.0.5

## 3.5.0

### Minor Changes

- 57c81240: Add clearer dev mode errors

### Patch Changes

- 023cd946: Fix table search when sorting
- 15a6eeab: Replace accordian with shadcn implementation, support inlined markdown
- 31903452: Fix heatmap y axis
- 33e46d1c: Add FlowChart component
- 2d0c00b9: Removes headless-ui dependency, replaces kebab menu with shadcn implementation
- 7e550a1d: Refactor the default layout into a single component, add a set of layout options
- 0042519f: Fix bug caused by navigating away from settings page
- 152b7224: Add x and y sort to Heatmap
- 72f9833a: Add date range, multi-select, search in dropdown
- Updated dependencies [1ff76fdf]
- Updated dependencies [152b7224]
- Updated dependencies [1ff76fdf]
- Updated dependencies [57c81240]
  - @evidence-dev/component-utilities@2.4.0
  - @evidence-dev/query-store@2.0.4

## 3.4.2

### Patch Changes

- 403f492c: Add dependency for chroma
- f3efd049: Fix for sparkline in bigvalue error message

## 3.4.1

### Patch Changes

- 6c37b473: Add weightedMean total agg to DataTable
- 37cbbc43: fix sqlconsole bug that crashed on navigation
- 1e665bf2: Replace sparkline component
- 858ea06f: Add error handling for dates in heatmap
- 5c492a00: Add non-delta comparisons to BigValue

## 3.4.0

### Minor Changes

- e09c5716: Add empty state to components

### Patch Changes

- bc3b2807: Fix min and max input issue in maps and heatmaps
- eb21097b: Add yScale prop to adjust yMin automatically
- 5ea44a86: Removed @apply from Header.svelte
- 168f657a: Add print control components
- 6ec752a7: Fix custom formatting retrieval for custom components
- 4352150c: Add dimension grid
- b864b3cd: Add additional echarts override options to charting library
- Updated dependencies [e09c5716]
- Updated dependencies [6ec752a7]
- Updated dependencies [b864b3cd]
  - @evidence-dev/component-utilities@2.3.0

## 3.3.1

### Patch Changes

- Updated dependencies [6a61ea17]
  - @evidence-dev/component-utilities@2.2.1

## 3.3.0

### Minor Changes

- 0f42e927: Add Heatmap and CalendarHeatmap components

### Patch Changes

- 9176c2cc: Added buildReactiveInputQuery for ensuring input query values are reactive
- 3e1da500: feat: add sqlconsole component
- cbc7e8a4: Fix custom color conditional formatting bug
- Updated dependencies [9176c2cc]
- Updated dependencies [0f42e927]
  - @evidence-dev/component-utilities@2.2.0
  - @evidence-dev/query-store@2.0.3

## 3.2.0

### Minor Changes

- ca1e46cf: Support multi axis charts for lines and bars
- c25fc1ac: Upgraded USMap component

### Patch Changes

- 3e3b3940: Add Grid component
- f7903b86: Update downloaded filenames
- cd9c80b2: Moved chart helper contexts from core-components to component utilites so they are accessible to 3rd party plugins
- 3427433c: Output less verbose errors for charts
- a6de89de: Adds option to include total rows in DataTables
- 2181ed9c: Fixes and upgrades for DataTable
- 9978899e: Fix query viewer data table column order
- f45a3a91: Add error handling for funnel charts
- 6d3021e2: add eCharts options to sankeyDiagram
- 39390112: Fix chartAreaHeight issue
- f501513a: infer types based on JS type instead of reading `_evidenceColumnTypes`
- Updated dependencies [f7903b86]
- Updated dependencies [cd9c80b2]
- Updated dependencies [fa0faf8c]
- Updated dependencies [a6de89de]
- Updated dependencies [c25fc1ac]
  - @evidence-dev/component-utilities@2.1.0
  - @evidence-dev/query-store@2.0.2

## 3.1.0

### Minor Changes

- 1ef5544d: Improve printing for Map viz

## 3.0.5

### Patch Changes

- 5a9edf0c: Sankey Diagram and Sankey Chart yield the same component
- 1027087a: Add xMin and xMax to ScatterPlot
- e3a88847: Schema explorer UI refresh, move into core-components

## 3.0.4

### Patch Changes

- 00145c4c: Add default prop to Dropdown, Add default and placeholder prop to TextInput
- 03b3b626: Added TextInput and ButtonGroup (+ DateAgg) input components
- 7b2b8a00: Add USQL to core components; augment faker datasource to generate better and consistent data
- Updated dependencies [03b3b626]
  - @evidence-dev/component-utilities@2.0.2

## 3.0.3

### Patch Changes

- Updated dependencies [913f5919]
  - @evidence-dev/component-utilities@2.0.1
  - @evidence-dev/query-store@2.0.1

## 3.0.2

### Patch Changes

-

## 3.0.1

### Patch Changes

- Fix DataTable rows being treated as a string

## 3.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Minor Changes

- 1097e5a9: add client ddb-backed dropdown component

### Patch Changes

- 689d9e2e: Improve DataTable & Chart loading states
- 0e3eec13: Added <Button/>
- 59938e50: SourceConfig handles missing plugins better
- f304fc1e: Address flickering on client side nav
- 840d1195: allow initialdata to saturate columns
- 5247996b: Improved behavior when copying environment variables
- 6b7a132d: Fix chart & datatable error state
- 77d09b54: DataTable, Chart, Value all handle missing data prop better
- 91034294: More QueryViewer tweaks
- 0e3eec13: Cleaned up <Accordion/>, added a `small` prop
- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- d79a3014: Clean up console logs
- 6eb93816: QueryViewer now respects QueryStore loading staet
  QueryViewer now updates when query text hmr updates

  QueryStore now accepts initialError when SSR query fails

  SSR / QueryStore now swallow errors unless build:strict is enabled
  (e.g. the error propogates to the UI where the user can more easily find it in dev mode / regular builds)

- 1235f278: Wrap most viz components in a QueryLoad to externalize interaction with QueryStore loading state
  Update Table of Contents when a header value changes
- 7c44653b: add error state to dropdowns, fix .clone() error, rename from prop to data
- b5592a3f: Usability Improvements
- 130950d7: revamp toast notifications
- b6683ba0: Deploy screen now shows environment variables for USQL
- b4de6d55: Hint and Button styling updates
- 4d5735a2: UX and design updates to source configuration
- d1265559: Ensure QueryViewer SQL not open by default
- 0a60b724: Remove reduntant QueryStatus notifications
- 77d09b54: BigValue handles missing data better
- be6cd88a: Wrap maps, tweak how data is passed
- bf4a112a: Update package.json to use new datasource field
- ef3a66dc: Adjust icon usage, dependencies
- 3708374d: Wait for props to be created before leaving loading state
- df9737fc: Style source config docs link
- 741885bf: Fix Source Query HMR
- 88e1a5ee: Toasts can now be dismissable
- d7477a44: Silence Empty Dataset error in console
- aea3be1a: Source HMR toasts are now persistent until dismissed
- 8f5d4ba8: Fix download button
- 9da3812e: - QueryStatus only notifies once now
  - Source HMR uses a path-specific queue to prevent queuing a file twice, and prevent running more than one source command at a time
- bbcd070e: Better error feedback for source names
- 0e3eec13: Re-arranged environment variable UI
- f5b06ca4: Changes to QueryLoad to make sure children get the published value
- 078fca3b: Error handling via QueryStores is more effective now
- cad09993: improve source refresh experience
- 583cea9e: Properly retrieve column types from QueryStores
- 16a17086: Handle empty datasets and changing datasets more effectively
- 15248699: fix for hugeints
- e70a6a3e: Allow chart to render non-querystore values
- 043a302a: Make sure that .at behaves as expected
- 26ad2d2c: Dropdown props are camelCase not snake_case
- 1c478a62: ReferenceArea now re-adds itself to the series when needed
- df9737fc: Adjust loading state condition again
- 7d298d28: Makes most "truthy" props reactive.
  Due to the wrapping, it seems that the type gets caught as a string somewhere along the line (likely becase the query finishes running)
  This causes it to revert to truthy.
- 75fa47a3: styling for dropdown
- 64921385: QueryStatus now checks that on/off are functions on import.meta.hot
- 6505351f: Misc Fixes
- b1427173: QueryViewer is more reactive now; and cleaned up to leverage QueryStore more effectively
- 2d2f774e: Style dropdowns as inline blocks
- 20127231: Bump all versions so version pinning works
- e9a63c71: Add loading states to DataTable and Chart
- 64d1405b: Loading state is now respected by Value and BigValue
- 0e3eec13: Updated Toast notifications with more types and default options
- 7a5225be: QueryStore more aggresively loads metadata; and ignore 0-length initial data
- c8968ea3: Settings UI now creates a connector when testing, if it doesn't already exist. It also won't lock up in more cases
- 120d22e9: Update docs link for sources
- 2371c8f1: Chart now keeps a copy of the querystore, even if data is clobbered. Waits for props and data to become available
- Updated dependencies [4ac6a688]
- Updated dependencies [5d280997]
- Updated dependencies [391282e5]
- Updated dependencies [840d1195]
- Updated dependencies [b25a95d7]
- Updated dependencies [6064fbbf]
- Updated dependencies [71f0d481]
- Updated dependencies [9132146b]
- Updated dependencies [7c4249c0]
- Updated dependencies [e1174aa1]
- Updated dependencies [6eb93816]
- Updated dependencies [7c44653b]
- Updated dependencies [9bd1cd29]
- Updated dependencies [130950d7]
- Updated dependencies [120d22e9]
- Updated dependencies [cb0fc468]
- Updated dependencies [bf4a112a]
- Updated dependencies [17a82581]
- Updated dependencies [ef4155ee]
- Updated dependencies [e1facffd]
- Updated dependencies [f38b8920]
- Updated dependencies [489a6069]
- Updated dependencies [88e1a5ee]
- Updated dependencies [e2162851]
- Updated dependencies [64ab3074]
- Updated dependencies [078fca3b]
- Updated dependencies [52e114cc]
- Updated dependencies [9e7ba37d]
- Updated dependencies [1097e5a9]
- Updated dependencies [fe466b13]
- Updated dependencies [ca1f90b3]
- Updated dependencies [f764cba4]
- Updated dependencies [982a17c6]
- Updated dependencies [583cea9e]
- Updated dependencies [130950d7]
- Updated dependencies [4053c976]
- Updated dependencies [043a302a]
- Updated dependencies [f051417f]
- Updated dependencies [6505351f]
- Updated dependencies [16a17086]
- Updated dependencies [4c6eae53]
- Updated dependencies [20127231]
- Updated dependencies [e9a63c71]
- Updated dependencies [64d1405b]
- Updated dependencies [0e3eec13]
- Updated dependencies [7a5225be]
- Updated dependencies [ba0d6f50]
- Updated dependencies [0e3eec13]
  - @evidence-dev/component-utilities@2.0.0
  - @evidence-dev/query-store@2.0.0
  - @evidence-dev/tailwind@1.0.0

## 2.0.0-usql.46

### Patch Changes

- d79a3014: Clean up console logs
- f5b06ca4: Changes to QueryLoad to make sure children get the published value
- 2d2f774e: Style dropdowns as inline blocks
- Updated dependencies [f38b8920]
  - @evidence-dev/query-store@2.0.0-usql.24
  - @evidence-dev/component-utilities@2.0.0-usql.32

## 2.0.0-usql.45

### Patch Changes

- 741885bf: Fix Source Query HMR
- 7d298d28: Makes most "truthy" props reactive.
  Due to the wrapping, it seems that the type gets caught as a string somewhere along the line (likely becase the query finishes running)
  This causes it to revert to truthy.

## 2.0.0-usql.44

### Patch Changes

- 043a302a: Make sure that .at behaves as expected
- Updated dependencies [043a302a]
  - @evidence-dev/query-store@2.0.0-usql.23
  - @evidence-dev/component-utilities@2.0.0-usql.31

## 2.0.0-usql.43

### Patch Changes

- Updated dependencies [489a6069]
  - @evidence-dev/component-utilities@2.0.0-usql.30

## 2.0.0-usql.42

### Patch Changes

- d1265559: Ensure QueryViewer SQL not open by default
- be6cd88a: Wrap maps, tweak how data is passed
- 9da3812e: - QueryStatus only notifies once now
  - Source HMR uses a path-specific queue to prevent queuing a file twice, and prevent running more than one source command at a time

## 2.0.0-usql.41

### Patch Changes

- 1235f278: Wrap most viz components in a QueryLoad to externalize interaction with QueryStore loading state
  Update Table of Contents when a header value changes
- d7477a44: Silence Empty Dataset error in console
- 15248699: fix for hugeints
- 1c478a62: ReferenceArea now re-adds itself to the series when needed
  - @evidence-dev/query-store@2.0.0-usql.22
  - @evidence-dev/component-utilities@2.0.0-usql.29

## 2.0.0-usql.40

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.21
- @evidence-dev/component-utilities@2.0.0-usql.28

## 2.0.0-usql.39

### Patch Changes

- 3708374d: Wait for props to be created before leaving loading state

## 2.0.0-usql.38

### Patch Changes

- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.20
  - @evidence-dev/component-utilities@2.0.0-usql.27

## 2.0.0-usql.37

### Patch Changes

- Updated dependencies [e2162851]
  - @evidence-dev/query-store@2.0.0-usql.19
  - @evidence-dev/component-utilities@2.0.0-usql.26

## 2.0.0-usql.36

### Patch Changes

- 689d9e2e: Improve DataTable & Chart loading states
- Updated dependencies [391282e5]
  - @evidence-dev/component-utilities@2.0.0-usql.25
  - @evidence-dev/query-store@2.0.0-usql.18

## 2.0.0-usql.35

### Patch Changes

- df9737fc: Style source config docs link
- df9737fc: Adjust loading state condition again

## 2.0.0-usql.34

### Patch Changes

- Update docs link for sources

## 2.0.0-usql.33

### Patch Changes

- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.17
  - @evidence-dev/component-utilities@2.0.0-usql.24

## 2.0.0-usql.32

### Patch Changes

- 16a17086: Handle empty datasets and changing datasets more effectively
- Updated dependencies [16a17086]
  - @evidence-dev/query-store@2.0.0-usql.16
  - @evidence-dev/component-utilities@2.0.0-usql.23

## 2.0.0-usql.31

### Patch Changes

- f304fc1e: Address flickering on client side nav

## 2.0.0-usql.30

### Patch Changes

- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- Updated dependencies [9132146b]
- Updated dependencies [4c6eae53]
- Updated dependencies [ba0d6f50]
  - @evidence-dev/component-utilities@2.0.0-usql.22
  - @evidence-dev/query-store@2.0.0-usql.15

## 2.0.0-usql.29

### Patch Changes

- 75fa47a3: styling for dropdown

## 2.0.0-usql.28

### Patch Changes

- 7a5225be: QueryStore more aggresively loads metadata; and ignore 0-length initial data
- Updated dependencies [5d280997]
- Updated dependencies [7a5225be]
  - @evidence-dev/component-utilities@2.0.0-usql.21
  - @evidence-dev/query-store@2.0.0-usql.14

## 2.0.0-usql.27

### Patch Changes

- 583cea9e: Properly retrieve column types from QueryStores
- e70a6a3e: Allow chart to render non-querystore values
- Updated dependencies [71f0d481]
- Updated dependencies [ef4155ee]
- Updated dependencies [583cea9e]
  - @evidence-dev/component-utilities@2.0.0-usql.20
  - @evidence-dev/query-store@2.0.0-usql.13

## 2.0.0-usql.26

### Patch Changes

- 64921385: QueryStatus now checks that on/off are functions on import.meta.hot

## 2.0.0-usql.25

### Patch Changes

- 91034294: More QueryViewer tweaks
- 0a60b724: Remove reduntant QueryStatus notifications
- aea3be1a: Source HMR toasts are now persistent until dismissed
- bbcd070e: Better error feedback for source names
- Updated dependencies [4ac6a688]
  - @evidence-dev/component-utilities@2.0.0-usql.19

## 2.0.0-usql.24

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.12
- @evidence-dev/component-utilities@2.0.0-usql.18

## 2.0.0-usql.23

### Patch Changes

- Updated dependencies [982a17c6]
  - @evidence-dev/component-utilities@2.0.0-usql.17
  - @evidence-dev/query-store@2.0.0-usql.11

## 2.0.0-usql.22

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/component-utilities@2.0.0-usql.16
  - @evidence-dev/query-store@2.0.0-usql.10
  - @evidence-dev/tailwind@1.0.0-usql.3

## 2.0.0-usql.21

### Patch Changes

- @evidence-dev/query-store@2.0.0-usql.9
- @evidence-dev/component-utilities@2.0.0-usql.15

## 2.0.0-usql.20

### Patch Changes

- 840d1195: allow initialdata to saturate columns
- 26ad2d2c: Dropdown props are camelCase not snake_case
- 6505351f: Misc Fixes
- 2371c8f1: Chart now keeps a copy of the querystore, even if data is clobbered. Waits for props and data to become available
- Updated dependencies [840d1195]
- Updated dependencies [6064fbbf]
- Updated dependencies [6505351f]
  - @evidence-dev/query-store@2.0.0-usql.8
  - @evidence-dev/component-utilities@2.0.0-usql.14

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

## 2.1.4

### Patch Changes

- 8408cb82: Revert settings links to open in new tab
- b4596313: reduces bar width for horizontal bar charts
- 551b036f: Add SSR loading to all charts
- 336dec14: Fix visual regressions in DataTable
- 8ad23995: Prevent 500 error when creating a directory which only contains a paramaterized page
- 0f54d725: Reduce font size in queryviewer
- 8ce5ce82: add fuzzy searching to datatable
- Updated dependencies [3462a045]
  - @evidence-dev/component-utilities@1.2.2

## 2.1.3

### Patch Changes

- 75ac7240: Add LastRefreshed component
- c4d59109: Fix legend issue with numeric series names
- Updated dependencies [8ed2af44]
  - @evidence-dev/component-utilities@1.2.1

## 2.1.2

### Patch Changes

- 41df3c72: fix snowflake persisting authenticator

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
