# @evidence-dev/preprocess

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
