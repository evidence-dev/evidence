# @evidence-dev/preprocess

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
