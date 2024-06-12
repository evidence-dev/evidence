# @evidence-dev/sdk

## 1.2.2

### Patch Changes

- 4e3b925e: Fix JSON serialization

## 1.2.1

### Patch Changes

- 25ea0fe4: Query.createReactive now handles sync updates better
- e400971e: SetTrackProxy is now callable to ensure that function values don't break pages

## 1.2.0

### Minor Changes

- 1e1486f3: Added Query.createReactive as a canonical way to have reactive queries; converted preprocessor to leverage this
- 1e1486f3: Created new input proxy, added tests, converted to use this instead of existing in-place proxy + detection method

### Patch Changes

- 276718dd: Add /utils export and a batchup util
- 7f85e600: version bumps

## 1.1.1

### Patch Changes

- cb6db1a1: Fix for Query not respecting noResolve properly
  Skeleton slot for QueryLoad was not properly passing the "loaded" slot prop

## 1.1.0

### Minor Changes

- dc073f6e: Moved /query-store export to /usql

### Patch Changes

- a95db3d3: Move types to devDependencies
- Updated dependencies [7620a1af]
- Updated dependencies [a95db3d3]
  - @evidence-dev/universal-sql@2.1.2

## 1.0.2

### Patch Changes

- Updated dependencies [5e0bbf31]
  - @evidence-dev/universal-sql@2.1.1

## 1.0.1

### Patch Changes

- 73421976: upgrade svelte deps

## 1.0.0

### Patch Changes

- 21b95fc8: Update USQL version to workspace
- Updated dependencies [ca3e593b]
  - @evidence-dev/universal-sql@2.1.0

## 0.0.1

### Patch Changes

- 6338875: Adjusted types and tsconfig
- 02752bd: Implement evidence-sdk connections edit
- b55d8e2: Add \$evidence/build with BUILD_ID and BUILD_DATE exports
- 76c9332: Ensure directory recursion works properly for wrapped simple connectors
- ab01260: Enter edit mode for freshly created sources
- eda12cb: - Add file watcher for static assets
- 4192323: Remove svelte-preprocess dep
- 1dfaf71: Added basic support for layout plugins
- 1dfaf71: Refreshed the add cli command
- d036482: Internalized @evidence-dev/query-store
- ec88e75: - Don't die when app.d.ts does not exist in a headless project
  - Check dev deps for sdk package to avoid overwriting the version
  - Svelte compatibility (no sveltekit)
    - Do not ignore files not prefixed with +
    - Add new copy style
  - Better error messaging
  - Copy ./components into template
    - Layouts can also specify where components should be placed
  - Try to handle paths better
    - This still needs improvements, .evidence vs \_evidence, headless vs regular projects, adapter-node vs adapter-static all can cause problems.
  - Added a slide deck example layout + project
- 4bdbb48: Update log output for add command
- 956686c: Create \$evidence/config virtual export for accessing the current project's configuration
- 94bad8b: Initial Preview version
- 20fc555: Implemented Build command for evidence projects
- 6b69c23: Lost track
- 74d88ad: Remove expect error directive
- 41da2c3: Allow datasource connectors to return a table with url instead of rows to point to remote parquet file
- 76c9332: Remove unused \$evidence/queries/\* types
- 76c9332: Ensure that caching and filtering rules are respected when evaluating queries
- 76c9332: Handle uncaught exceptions / unhandled promise rejections
- 1dfaf71: Added a plugin installation command
- 76c9332: Remove filter field from layout plugin specification, needs re-evaluation and more planning
- c8319d8: Change projectRoot to attempt to auto-detect if we are running in a template
- 13800a3: Include a static directory when copying to template
- 76c9332: Remove the template directory before re-copying from the template package
- 76c9332: Improve error messages for a malformed component manifest
- a8f6aab: - No longer uses fork to create a child process
  - Can accept projects w/o a components directory now

## 0.0.1-preview.11

### Patch Changes

- b55d8e2: Add \$evidence/build with BUILD_ID and BUILD_DATE exports
- d036482: Internalized @evidence-dev/query-store
- 956686c: Create \$evidence/config virtual export for accessing the current project's configuration
- 20fc555: Implemented Build command for evidence projects
- 41da2c3: Allow datasource connectors to return a table with url instead of rows to point to remote parquet file

## 0.0.1-preview.10

### Patch Changes

- eda12cb: - Add file watcher for static assets
- 74d88ad: Remove expect error directive

## 0.0.1-preview.9

### Patch Changes

- 4bdbb48: Update log output for add command
- c8319d8: Change projectRoot to attempt to auto-detect if we are running in a template
- 13800a3: Include a static directory when copying to template

## 0.0.1-preview.8

### Patch Changes

- a8f6aab: - No longer uses fork to create a child process
  - Can accept projects w/o a components directory now

## 0.0.1-preview.7

### Patch Changes

- 76c9332: Ensure directory recursion works properly for wrapped simple connectors
- ec88e75: - Don't die when app.d.ts does not exist in a headless project
  - Check dev deps for sdk package to avoid overwriting the version
  - Svelte compatibility (no sveltekit)
    - Do not ignore files not prefixed with +
    - Add new copy style
  - Better error messaging
  - Copy ./components into template
    - Layouts can also specify where components should be placed
  - Try to handle paths better
    - This still needs improvements, .evidence vs \_evidence, headless vs regular projects, adapter-node vs adapter-static all can cause problems.
  - Added a slide deck example layout + project
- 76c9332: Remove unused \$evidence/queries/\* types
- 76c9332: Ensure that caching and filtering rules are respected when evaluating queries
- 76c9332: Handle uncaught exceptions / unhandled promise rejections
- 76c9332: Remove filter field from layout plugin specification, needs re-evaluation and more planning
- 76c9332: Remove the template directory before re-copying from the template package
- 76c9332: Improve error messages for a malformed component manifest

## 0.0.1-preview.6

### Patch Changes

- Lost track

## 0.0.1-preview.5

### Patch Changes

- Added basic support for layout plugins
- Refreshed the add cli command
- Added a plugin installation command

## 0.0.1-preview.4

### Patch Changes

- ab01260: Enter edit mode for freshly created sources

## 0.0.1-preview.3

### Patch Changes

- 4192323: Remove svelte-preprocess dep

## 0.0.1-preview.2

### Patch Changes

- 02752bd: Implement evidence-sdk connections edit

## 0.0.1-preview.1

### Patch Changes

- 6338875: Adjusted types and tsconfig

## 0.0.1-preview.0

### Patch Changes

- Initial Preview version
