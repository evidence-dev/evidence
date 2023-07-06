# @evidence-dev/components

## 3.0.0-usql.1

### Patch Changes

- Updated dependencies [e6091323]
  - @evidence-dev/plugin-connector@2.0.0-usql.1

## 3.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- 75560a31: Consolidate tailwind presets into tailwind package
- Updated dependencies [cb0fc468]
- Updated dependencies [4e783f36]
- Updated dependencies [75560a31]
  - @evidence-dev/component-utilities@2.0.0-usql.0
  - @evidence-dev/core-components@2.0.0-usql.0
  - @evidence-dev/duckdb@1.0.0-usql.0
  - @evidence-dev/plugin-connector@2.0.0-usql.0

## 2.4.5

### Patch Changes

- 963d060c: removed redundant lines from tailwind.config.js
- 4ced5e33: Prevent data json from being generated multiple times for templated pages
- Updated dependencies [d999fe37]
- Updated dependencies [4e94b57a]
- Updated dependencies [121c7868]
- Updated dependencies [ed2f4728]
- Updated dependencies [f6be30cf]
  - @evidence-dev/core-components@1.1.0
  - @evidence-dev/component-utilities@1.1.0
  - @evidence-dev/plugin-connector@1.1.0

## 2.4.4

### Patch Changes

- Updated dependencies [168af3bb]
- Updated dependencies [929a0074]
- Updated dependencies [eb886615]
  - @evidence-dev/core-components@1.0.3

## 2.4.3

### Patch Changes

- Updated dependencies [2b7809e6]
  - @evidence-dev/core-components@1.0.2

## 2.4.2

### Patch Changes

- d3a30089: Multi-line alert spacing fixed.
- Updated dependencies [44c0c4ca]
- Updated dependencies [a38148b5]
  - @evidence-dev/core-components@1.0.1

## 2.4.1

### Patch Changes

- 5b6156d9: added support for new authentication methods for bigquery and snowflake
- ac3d47d3: fixes bugs preventing usage directly from npm
- 84208c04: updated licenses, general cleanup
- 2bb85b15: various visual regression fixes
- Updated dependencies [ac3d47d3]
- Updated dependencies [7873115f]
- Updated dependencies [d7d4dfce]
- Updated dependencies [4cd28cf5]
- Updated dependencies [84208c04]
  - @evidence-dev/component-utilities@1.0.0
  - @evidence-dev/core-components@1.0.0
  - @evidence-dev/plugin-connector@1.0.0

## 2.4.0

### Minor Changes

- 52c540d5: ReferenceLine and ReferenceArea components
- 61b60097: Expose format function to end users
- f15e5685: Added SQL Server driver

### Patch Changes

- 5d623eda: Error icon in value component is now vertically centered and color is white
- 5f813cdd: Fixed chart width not adjusting properly when printing to PDF
- 9ad17fbf: Fixed visual regression of collapsible section dropdown's transition animation
- ae3a487e: Make download buttons non-copyable
- 3a023d5c: Update docs link
- 185f1b8d: Fixed component copy-paste not working in Firefox
- ec8d363a: Update DataTable paginated property when dataset size changes
- a3cf89e7: Allow setting of the chartAreaHeight via props on supported chart types
- b333b0ea: Update echarts version

## 2.3.2

### Patch Changes

- 97babfb2: Fix <CodeBlock /> on Windows (OS)

## 2.3.1

### Patch Changes

- e2b0b5d1: Fix legend and chart spacing for funnel chart
- 5be07009: Fix horizontal table scroll bug on Windows
- 6d5d22dd: Fix query viewer still visible on windows (OS)
- aff6c041: fix list styling

## 2.3.0

### Minor Changes

- 218ce1a6: Clearing minor visual regressions
- 2cf93f09: TailwindCSS has been integrated into the project and themed according to Evidence's styles.
  Minor version bump because this may interact with downstream projects.
- 3b41627d: External .sql files are now supported using the sources directory and frontmatter

### Patch Changes

- 822417fb: Added improved support for frontmatter
- 138a3891: hide pagemenu on click outside of menu
- 3b3ceb17: Add the basic Alert Component
- 3de027b4: Added Tabs component
- 195f1004: Fix icon color regressions
- 2cf93f09: BigValue & ErrorChart now use Tailwind for all styles

## 2.2.1

### Patch Changes

- 847e8c81: Adds a "Kebab" style page menu to all (non settings) pages, with links to deployment, docs and buttons to show / hide queries.
- fa958c52: Performance Improvements; Queries now run in batches of 2; Charts are less eager to resize

## 2.2.0

### Minor Changes

- f7a08956: Addition of missing dependencies in multiple pkg, fix the LinkedChart by moving to svelte:component
- 54904e9e: Hot Fix, Fix show/hide Query button, rework on reactivity and query toast, move build:strict to vite command

### Patch Changes

- f1b25b51: update links to docs
- e4f698a4: Add Evidence deploy option
- 406cdc6e: Fix for DataTable search bug

## 2.1.0

### Minor Changes

- a7a9757: Minor import changes, adjust generated vite config, minor variable rename

## 2.0.0

### Major Changes

- 96c9c81: Upgrade to svelte kit 1.0.0, remove support for Node 14

### Minor Changes

- 8439630: Component for Sankey Diagram added in th example project

### Patch Changes

- 15e9176: Adds prompt and link to settings in the ErrorChart Component when credentials are missing
- 84b097a: Add ability to display non-SQL codeblocks in markdown
- 45822a6: Updating deps to support SK 1.0.0
- 67e7597: remove unused css that was printing warnings to terminal
- 5bfde4f: Updated the account number format on SnowflakeForm
- 69f2f9c: Updating deps for SK 1.0 upgrade

## 1.10.1

### Patch Changes

- 1e90c45: Fix for breadcrumb capitalization

## 1.10.0

### Minor Changes

- 85c3f94: New UI test suite based on playwright, addition of aria-label & id on tooltip
- 005a55e: Add CSV connector

### Patch Changes

- 794e61c: Fix for value formatting in DataTable
- 315b243: Fix for data download button in DataTable
- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [c9dde3d]
  - @evidence-dev/telemetry@1.0.5

## 1.9.0

### Minor Changes

- c0f69cb: Updated the examples for funnel chart in docs, addressed PR feedback
- 5fbbb9c: US state map
- c801fa9: New capability to fail build if there are errors in components or queries
- 470291c: Addition of error handling on <DataTable .../> with unknown or missing column.id fixing #580

### Patch Changes

- e2550fd: Add link function to US map
- ccbca9c: Fixes table of contents links for parameterized pages
- fa4edec: Reduced funnel chart height, added legend and updated label to show values.
- c06c1a1: Adds US Map component to page imports
- 77cc9c9: Adds strict error handling option to USMap
- 2e81dbe: Reduces size of imports from echarts library
- db92de1: Adds a minimal venn diagram to available components.

## 1.8.0

### Minor Changes

- 453919a: Fix the menu button disappearing in the sidebar

### Patch Changes

- 9d42aae: Minor spacing fixes in settings menu
- b665eb2: Fixes BigValue comparison styling for Windows
- 80eaa2d: Fixes default image styling
- 5e5cf29: Fixes link column behaviour for parameterized pages

## 1.7.0

### Minor Changes

- d83c741: Adds image, link, and row link support in DataTable

### Patch Changes

- afda5ba: Fix reactivity of DataTable on errors
- 5a44815: Ability to style project by overwriting app.css
- 84dc796: Fixes treatment of nulls in charts
- c993d09: Prevent header shading showing up in PDF / print export
- 8a7bd67: Fixes bug where styling from the Settings page leaked into other pages

## 1.6.0

### Minor Changes

- 141dc5b: Improved DataTable component

## 1.5.0

### Minor Changes

- 94805f9: Add data download option to Charts
- e098028: Add FunnelChart component
- 2a1ff16: Support scroll on datatables

### Patch Changes

- fed8cf3: fix install command
- d41cbe4: Fixes column title formatting for ID columns
- 6445c6f: Changes custom date format example input
- 12aced0: Fix 100% stacked chart reactivity
- ea10232: Cleaning up svelte warnings
- c013859: Adds optional schema field for postgres connector
- c50ce10: bump tiny charts library
- 1f339fb: Improve accessiblity of clickable elements by making them <button> elements
- 224c553: Updates to visual hierarchy of H1-H6 and lists
- 7afdf97: Removes sort by default for Charts (Bar, Line, Area)

## 1.4.2

### Patch Changes

- 1b052b2: Bug fix for column title formatting
- 0ca1dd2: Add accessibility to QueryViewer, DataTable, BreadCrumbs, ECharts, and DownloadData
- 9bd0f88: Fixes bug which prevented live updates on query status in development mode
- 32e797f: Add port and ssl options to MySQL form

## 1.4.1

### Patch Changes

- 3b27c0e: Freeze header bar to top of screen when scrolling
- 9728baf: Fix charts rendering issue in webkit browsers
- 75d5863: Fix indetation in sql viewer
- bb18575: Add instructions on how to set up different data environments.

## 1.4.0

### Minor Changes

- c68f658: Add maxWidth and minWidth style props to BigValue component. Default set for minWidth to give smaller BigValues more room.

### Patch Changes

- 79dca60: Fixes bug which prevented dev mode reloading on changes to queries in paramatarized pages

## 1.3.14

### Patch Changes

- 975fdb1: including missing changeset for previous merge

## 1.3.13

### Patch Changes

- 81755d7: Minor bug fix
- 1922765: fix missing rows option in data table

## 1.3.12

### Patch Changes

- 44b1412: Remove the need for a hard page refresh when editing queries, and provide live feedback on the status of queries while they run

## 1.3.11

### Patch Changes

- 76f5617: Updates to dev workspace
- de49590: Prevent parameterized pages from showing in sidebar at root level, addresses #410

## 1.3.10

### Patch Changes

- 77cee78: Add blockquote styling
- f16158e: Updated telemetry to include operating system
- 7ea5780: Fixes breadcrumb link issue for parameterized pages
- 03bf05f: Fixes a minor code presentation issue
- 90b1846: Updates telemetry to include database type
- 7aaa078: Fix for chart size in flex layout
- Updated dependencies [f16158e]
- Updated dependencies [90b1846]
  - @evidence-dev/telemetry@1.0.4

## 1.3.9

### Patch Changes

- fb3b5ec: Make article widths consistent across breakpoint
- 245c76f: Fixes bug related to nulls in date columns

## 1.3.8

### Patch Changes

- dec9ebe: Turns off format tags for string columns
- 3523b63: Fixes form item for Snowflake connector
- e2383bb: Adding Redshift to the UI
- fe65489: Improves date parsing and consistency
- 08074f1: Applies date and time handling consistently across components

## 1.3.7

### Patch Changes

- 6dce090: Fix chart copy paste bug and better support command-a keyboard shortcut for copying full pages
- df25e4d: Log telemetry opt outs, include anonymized hash of git repo
- Updated dependencies [df25e4d]
  - @evidence-dev/telemetry@1.0.3

## 1.3.6

### Patch Changes

- 00f097f: Allows stacked charts to work with multiple y columns, and without requiring x and y to be supplied
- fba883b: Fixes data completion for time-based bar charts
- e6b72ac: Fixes appearance of boolean false values in DataTable
- 90e3748: Adds 100% stacked charts
- 63a758b: Fix for tooltip column name formatting
- 81ff4e1: Enhances scatter and bubble tooltips by letting you add a title for each point
- 0091256: Adds styling to native markdown tables

## 1.3.5

### Patch Changes

- 49bc1d6: Updates to settings page layout
- a60d10e: Changing error message on lack of query object to reference {my_query} not {data.myquery}
- 5c81d4d: Add BigValue components

## 1.3.4

### Patch Changes

- 7469dc2: fix the hamburger overlap with the show queries button

## 1.3.3

### Patch Changes

- ad52ef7: moving mobile hamburger to top right

## 1.3.2

### Patch Changes

- bc62401: Add testIds to support e2e testing
- 9275cda: Fixed the hms format to have two digits all the time for mm and ss
- 07971d8: Ensure the version of Vite stays belows 3.0
- b5d4f28: adding currency 0 suffix tag eg usd0, increased threshold for applying units (k,M,B,T)

## 1.3.1

### Patch Changes

- 87fd331: Fix formatting for <currency-code>2k format
- 9d2726b: issue-343 auto formatting for unformatted number columns, auto formatted currencies. Introduced Jest unit tests for ES6 Modules.
- 6ed9a37: GA new formatting system without feature flags
- 4702901: Adds support for static folder that users can put files in
- e5a3eb7: Minor changes to formatting settings panel
- 77c205d: Made `pct` an auto format showing 3 significant digits from the median's leading digit

## 1.3.0

### Minor Changes

- 51c65c5: Fixed a dependency issue with the ssf library

## 1.2.0

### Minor Changes

- 6a7fb35: Update to how the built-in formatting works and custom formats behind feature flag
- 06cc44a: Remove support for value and fmt props in <Value /> tag
- 9f894e7: Adds value and column title formatting to chart tooltips, with revised tooltips for scatter, bubble, and histogram charts

### Patch Changes

- 23d0234: Adds legacy FLOAT type to BigQuery connector types
- 7a87d0b: Add support for native database types to all components
- 04ad3b9: Indicate the data type that evidence has identified in the queryviewer data table
- f6d00c3: Bug fix for settings page when gitignore file is missing
- e2c7319: Adds formatting to query viewer data table
- 23f90b7: Bug fix for tooltips in composable charts with multiple y columns
- 6fd2f57: Avoids creating gitignore file when gitignore not selected

## 1.1.4

### Patch Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components
- f651bda: Adding a database and warehouse field to the Snowflake connector. Without these it is difficult to run queries in a Snowflake DB.
- d225abf: Provide images of charts when users are attempting to copy and paste

## 1.1.3

### Patch Changes

- 44ebd1a: Update the telemetry settings panel to show the correct state on initial startup, and provide more environment variable friendly alternatives ("yes"/ "no") to opt out of telemetry in production.

## 1.1.2

### Patch Changes

- e8ceec3: Fix sorting bug that caused side effects from components sorting datasets

## 1.1.1

### Patch Changes

- 6a078e6: Dependency fix and minor bug fixes

## 1.1.0

### Minor Changes

- 3b5f1af: Adds download to CSV feature to query viewer and DataTables
- fc45df2: Adds chart download feature to generate a PNG of a chart

### Patch Changes

- 8170b66: Add telemetry options to the development mode settings page.
- 80d38a5: Fixes scroll and spacing issues in DataTable

## 1.0.3

### Patch Changes

- 174a626: Fixing default showQueries behaviour to be true by default in dev

## 1.0.2

### Patch Changes

- 2e483e4: Support passing arguments to svelte-kit through the CLI
- eeabad3: Add vercel deployment instructions to the development-mode settings page, and to the project docs.

## 1.0.1

### Patch Changes

- 8c125c5: Allow for a missing git repo

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 54044fa: Update packaging mechanics
- 3d0d93c: Various UI changes
- 9d6417e: Fixed version control panel
- a50f8c2: fix sqlite gitignore error, settings optionals, and misc UI fixes
- 36dcd68: Fix import error for show hide queries button
- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- e45a29a: Add a deployment panel to settings

## 1.0.0-next.7

### Patch Changes

- Fixed version control panel

## 1.0.0-next.6

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.5

### Patch Changes

- e45a29a: Add a deployment panel to settings

## 1.0.0-next.4

### Patch Changes

- Fix import error for show hide queries button

## 1.0.0-next.3

### Patch Changes

- 3d0d93c: Various UI changes

## 1.0.0-next.2

### Patch Changes

- Fixes sqlite gitignore error, settings optionals, and misc UI bugs

## 1.0.0-next.1

### Patch Changes

- Update packaging mechanics

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

## 0.1.21

### Patch Changes

- b1bd12f: Patch to test @next release

## 0.1.20

### Patch Changes

- 6f74e1c: Another patch for the release process

## 0.1.19

### Patch Changes

- Patch bump to bring this back to a public release.

## 0.1.18

### Patch Changes

- 0713a5d: take these back to public

## 0.1.17

### Patch Changes

- e540391: Updating the packaging process to support pre-releases

## 0.1.16

### Patch Changes

- c75b082: Fix BubbleChart's treatment of multiple y columns

## 0.1.15

### Patch Changes

- bd66abe: Fix BubbleChart scaling function

## 0.1.14

### Patch Changes

- 478de2c: testing changesets
