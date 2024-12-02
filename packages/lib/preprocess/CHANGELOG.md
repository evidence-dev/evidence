# @evidence-dev/preprocess

## 5.2.3

### Patch Changes

- 4d5e9c71e: Automatically add injected Evidence imports to Vite's `optimizeDeps.include`

## 5.2.2

### Patch Changes

- 71a20080c: Reactivity improvements

## 5.2.1

### Patch Changes

- 0a0695588: fix query compilation for queries that include String.prototype.replace special strings
- c8315da2e: Update svelte to resolve security vulnerability
- 06313c848: fix prerendered arrow files not loading

## 5.2.0

### Minor Changes

- 4c1e5330c: Switch to new input paradigm

## 5.1.7

### Patch Changes

- b84f22fce: properly typecheck .cjs/.js files in preprocess
- f7253ad4b: Fix noisy "Failed to pre-render columns" log during build

## 5.1.6

### Patch Changes

- 8c2982505: Update vitest to latest

## 5.1.5

### Patch Changes

- 32035eeaa: Override fast-xml-parser version to >=4.4.1 to resolve vulnerability

## 5.1.4

### Patch Changes

- e50e7ed58: Pre-render column information using DESCRIBE query

## 5.1.3

### Patch Changes

- d6b25b02c: Fix source query triggering HMR on the page
- 6cdedceb0: Remove db-orchestrator

## 5.1.2

### Patch Changes

- 87e56af2: Handle noResolve state while on the server

## 5.1.1

### Patch Changes

- c88cb063: Rearranged component initialization to ensure initial data is populating more correctly

## 5.1.0

### Minor Changes

- 1e1486f3: Added Query.createReactive as a canonical way to have reactive queries; converted preprocessor to leverage this
- 1e1486f3: Created new input proxy, added tests, converted to use this instead of existing in-place proxy + detection method

### Patch Changes

- 3f53e809: Add syntax highlighting to code blocks
- 564f3444: fix minor bugs in queryload/querystore/preprocess, add strict cast to daterange

## 5.0.0

### Major Changes

- d60fdad7: Convert preprocess to use Query from sdk

## 4.1.2

### Patch Changes

- e1e9a068: Add automatic links to headers

## 4.1.1

### Patch Changes

- 3a91fdc1: lower memory consumption during builds

## 4.1.0

### Minor Changes

- ca3e593b: - Updated major dependencies (Svelte, SvelteKit, Vite) to improve memory usage when building

## 4.0.3

### Patch Changes

- 5a1e46a5: Fix for svelte vite errors
- 008cf432: Roll back proxy server
- 69b9ed32: Fix file imports for evidence package

## 4.0.2

### Patch Changes

- 1ff76fdf: add activeQueries and backgroundFetch to querystore

## 4.0.1

### Patch Changes

- 2082578e: Added support for HMR in external query files

## 4.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

- e1facffd: Add QueryStore concept

  - Loads data as it is requested, rather than all at page-load / build
  - Uses duckdb to get data length / column data
  - Ties metadata, mutation queries, and data together to make component development easier
  - Provides information regarding loading (and query errors in the future)

### Minor Changes

- 1097e5a9: add client ddb-backed dropdown component
- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering

### Patch Changes

- 391282e5: QueryStore now uses a factory pattern to enforce caching
- f304fc1e: Address flickering on client side nav
- b25a95d7: Misc fixes
- 4293e084: Clean up console logs
- b3bdd91a: fix regression around debouncing queries
- 5e54e13e: Fix regression
- e6b67b66: Fix build issue
- e1174aa1: added profile function to note load and query times
- 6eb93816: QueryViewer now respects QueryStore loading staet
  QueryViewer now updates when query text hmr updates

  QueryStore now accepts initialError when SSR query fails

  SSR / QueryStore now swallow errors unless build:strict is enabled
  (e.g. the error propogates to the UI where the user can more easily find it in dev mode / regular builds)

- 7c44653b: add error state to dropdowns, fix .clone() error, rename from prop to data
- 1dcb5afe: Escape undefined when looking for unset inputs
- 9b1ac9b7: removed evidencemeta on the data object
- e49793e4: fix query results not updating in hmr
- bf4a112a: Update package.json to use new datasource field
- 4e288bc6: Big improvement to SSR
- bb8451c2: Fix error from conversion
- 64ab3074: Add USQL Context wrappers to component utilities
- 17a2d5ee: Expose `params` var instead of `$page.params`
- 9e7ba37d: Remove usql context; proper approach is to use page store now. Context is not reactive; and would require a store which is the behavior already present in \$app/stores.page
- efa96920: External SQL files now live in queries rather than sources
- cad09993: improve source refresh experience
- fe489a67: fix params is undefined error
- 3fb2ead5: Debouncing has been applied to querystores; in theory, changing queries will now retain their state as well
- 6bf5003a: add bypass to SSR'd inputs bug
- 130950d7: add client/build time guardrails
- 90e152cb: inline query HMR now works
- 7a05f941: Clear QueryStore cache on HMR
- 20127231: Bump all versions so version pinning works
- e9a63c71: Add loading states to DataTable and Chart
- 20d2a785: Handle template literal errors in preprocess

## 4.0.0-usql.29

### Patch Changes

- bb8451c2: Fix error from conversion

## 4.0.0-usql.28

### Patch Changes

- 1dcb5afe: Escape undefined when looking for unset inputs
- 7a05f941: Clear QueryStore cache on HMR

## 4.0.0-usql.27

### Patch Changes

- 20d2a785: Handle template literal errors in preprocess

## 4.0.0-usql.26

### Patch Changes

- 391282e5: QueryStore now uses a factory pattern to enforce caching

## 4.0.0-usql.25

### Patch Changes

- f304fc1e: Address flickering on client side nav
- fe489a67: fix params is undefined error

## 4.0.0-usql.24

### Patch Changes

- 4e288bc6: Big improvement to SSR

## 4.0.0-usql.23

### Patch Changes

- 17a2d5ee: Expose `params` var instead of `$page.params`

## 4.0.0-usql.22

### Patch Changes

- 90e152cb: inline query HMR now works

## 4.0.0-usql.21

### Patch Changes

- Update package.json to use new datasource field

## 4.0.0-usql.20

### Patch Changes

- e49793e4: fix query results not updating in hmr

## 4.0.0-usql.19

### Patch Changes

- 6bf5003a: add bypass to SSR'd inputs bug

## 4.0.0-usql.18

### Patch Changes

- b25a95d7: Misc fixes

## 4.0.0-usql.17

### Patch Changes

- 6eb93816: QueryViewer now respects QueryStore loading staet
  QueryViewer now updates when query text hmr updates

  QueryStore now accepts initialError when SSR query fails

  SSR / QueryStore now swallow errors unless build:strict is enabled
  (e.g. the error propogates to the UI where the user can more easily find it in dev mode / regular builds)

- 7c44653b: add error state to dropdowns, fix .clone() error, rename from prop to data

## 4.0.0-usql.16

### Patch Changes

- Fix regression

## 4.0.0-usql.15

### Patch Changes

- b3bdd91a: fix regression around debouncing queries

## 4.0.0-usql.14

### Minor Changes

- 1097e5a9: add client ddb-backed dropdown component

### Patch Changes

- 3fb2ead5: Debouncing has been applied to querystores; in theory, changing queries will now retain their state as well
- 130950d7: add client/build time guardrails

## 4.0.0-usql.13

### Patch Changes

- cad09993: improve source refresh experience

## 4.0.0-usql.12

### Major Changes

- e1facffd: Add QueryStore concept

  - Loads data as it is requested, rather than all at page-load / build
  - Uses duckdb to get data length / column data
  - Ties metadata, mutation queries, and data together to make component development easier
  - Provides information regarding loading (and query errors in the future)

### Patch Changes

- e9a63c71: Add loading states to DataTable and Chart

## 4.0.0-usql.11

### Patch Changes

- 20127231: Bump all versions so version pinning works

## 4.0.0-usql.10

### Patch Changes

- efa96920: External SQL files now live in queries rather than sources

## 4.0.0-usql.9

### Patch Changes

- Clean up console logs

## 4.0.0-usql.8

### Patch Changes

- Remove usql context; proper approach is to use page store now. Context is not reactive; and would require a store which is the behavior already present in \$app/stores.page

## 4.0.0-usql.7

### Patch Changes

- Fix build issue

## 4.0.0-usql.6

### Patch Changes

- 64ab3074: Add USQL Context wrappers to component utilities

## 4.0.0-usql.5

## 3.2.1

### Patch Changes

- 17e2b444: fix unnamed query logic

## 3.2.0

### Minor Changes

- 9b8346f0: update core layout, tailwind config, align components to new layout, deprecate sticky alert

## 3.1.2

### Patch Changes

- 86635f53: Adds twitter og tags based on og provided in frontmatter
- ca551518: Add support for markdown partials

## 3.1.1

### Patch Changes

- 9f568270: stop exporting the metadata object from mdsvex frontmatter

## 3.1.0

### Minor Changes

- de129514: Addtional UI components added

### Patch Changes

- 75560a31: Consolidate tailwind presets into tailwind package

## 4.0.0-usql.4

### Patch Changes

- e1174aa1: added profile function to note load and query times

## 4.0.0-usql.3

### Minor Changes

- de129514: Addtional UI components added

## 4.0.0-usql.2

### Patch Changes

- 9b1ac9b7: removed evidencemeta on the data object

## 4.0.0-usql.1

### Minor Changes

- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering

## 4.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- 75560a31: Consolidate tailwind presets into tailwind package

## 3.0.1

### Patch Changes

- 8865684b: added ability for classes to be added to markdown-generated tags

## 3.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

## 2.4.0

### Minor Changes

- 52c540d5: ReferenceLine and ReferenceArea components
- 61b60097: Expose format function to end users

## 2.3.2

### Patch Changes

- 14a6bff7: Add ability to hide title from page when defined in frontmatter

## 2.3.1

### Patch Changes

- aff6c041: fix list styling

## 2.3.0

### Minor Changes

- 3b41627d: External .sql files are now supported using the sources directory and frontmatter

### Patch Changes

- 822417fb: Added improved support for frontmatter
- 3b3ceb17: Add the basic Alert Component
- 3de027b4: Added Tabs component

## 2.2.0

### Minor Changes

- f7a08956: Addition of missing dependencies in multiple pkg, fix the LinkedChart by moving to svelte:component
- 54904e9e: Hot Fix, Fix show/hide Query button, rework on reactivity and query toast, move build:strict to vite command

## 2.1.0

### Minor Changes

- a7a9757: Minor import changes, adjust generated vite config, minor variable rename

## 2.0.0

### Major Changes

- 96c9c81: Upgrade to svelte kit 1.0.0, remove support for Node 14

### Minor Changes

- 8439630: Component for Sankey Diagram added in th example project

### Patch Changes

- 84b097a: Add ability to display non-SQL codeblocks in markdown

## 1.5.1

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch

## 1.5.0

### Minor Changes

- c801fa9: New capability to fail build if there are errors in components or queries

### Patch Changes

- c06c1a1: Adds US Map component to page imports
- db92de1: Adds a minimal venn diagram to available components.

## 1.4.0

### Minor Changes

- 141dc5b: Improved DataTable component

## 1.3.0

### Minor Changes

- e098028: Add FunnelChart component

### Patch Changes

- f5ec614: Ensure that precise evidence types are populated on all query objects

## 1.2.6

### Patch Changes

- 79dca60: Fixes bug which prevented dev mode reloading on changes to queries in paramatarized pages
- 755b1bb: Fix bug which caused bare query references to return undefined while page was loading

## 1.2.5

### Patch Changes

- 44b1412: Remove the need for a hard page refresh when editing queries, and provide live feedback on the status of queries while they run

## 1.2.4

### Patch Changes

- 74a09a0: Include BigValue components in the default imports

## 1.2.3

### Patch Changes

- 1dec9a4: Resolves a bug introduced by smart quotes

## 1.2.2

### Patch Changes

- d933ab8: Fix test-env failing to build + silent errors when test-env fails to build
- 11b6dd0: Turns on quote formatting
- 6ed9a37: GA new formatting system without feature flags

## 1.2.1

### Patch Changes

- 1dec76c: Fixed a bug with query names not being updated on reloads

## 1.2.0

### Minor Changes

- 6a7fb35: Update to how the built-in formatting works and custom formats behind feature flag

## 1.1.1

### Patch Changes

- a83857e: Downgrade remark-parse dependency to match mdsvex version, and avoid security warning.

## 1.1.0

### Minor Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components

### Patch Changes

- a728873: Ignore indented code blocks when extracting SQL queries.

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 3d0d93c: Various UI changes
- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.2

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel

## 1.0.0-next.1

### Patch Changes

- 3d0d93c: Various UI changes

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections
