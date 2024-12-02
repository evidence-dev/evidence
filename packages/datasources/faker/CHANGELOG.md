# @evidence-dev/faker-datasource

## 2.1.5

### Patch Changes

- 888bd8e50: Use a freshly seeded faker instance for each table

## 2.1.4

### Patch Changes

- 32035eeaa: Override fast-xml-parser version to >=4.4.1 to resolve vulnerability

## 2.1.3

### Patch Changes

- 6cdedceb0: Remove db-orchestrator

## 2.1.2

### Patch Changes

- 6421c6d9b: Add icon to source configuration

## 2.1.1

### Patch Changes

- 2e3c3f56: Converted source generation script to output sdk compatible queries
- a95db3d3: Move types to devDependencies

## 2.1.0

### Minor Changes

- ca3e593b: - Updated major dependencies (Svelte, SvelteKit, Vite) to improve memory usage when building

## 2.0.4

### Patch Changes

- 5e9b27db: Faker datasource minor fixes

## 2.0.3

### Patch Changes

- 2bcbf0ed: Add keywords to improve searchability for datasources

## 2.0.2

### Patch Changes

- 1dd61938: Fix options passed to faker functions

## 2.0.1

### Patch Changes

- 03b3b626: Added TextInput and ButtonGroup (+ DateAgg) input components
- 7b2b8a00: Add USQL to core components; augment faker datasource to generate better and consistent data

## 2.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- 14269dbc: Add seed option for reproducable results
- bf4a112a: Update package.json to use new datasource field
- 26ad2d2c: Faker no longer holds an internal cache between source runes
- cd57ba69: Add new interface for datasources for fine-grained control of output
- c4822852: Support for streaming results
- aa2f3bfc: Faker now re-executes when getting a new runner
- 544b1d5b: Many improvements to faker datasource
- 20127231: Bump all versions so version pinning works

## 2.0.0-usql.7

### Patch Changes

- 14269dbc: Add seed option for reproducable results

## 2.0.0-usql.6

### Patch Changes

- Update package.json to use new datasource field

## 2.0.0-usql.5

### Patch Changes

- 26ad2d2c: Faker no longer holds an internal cache between source runes
- aa2f3bfc: Faker now re-executes when getting a new runner

## 2.0.0-usql.4

### Patch Changes

- 544b1d5b: Many improvements to faker datasource

## 2.0.0-usql.3

### Patch Changes

- cd57ba69: Add new interface for datasources for fine-grained control of output

## 2.0.0-usql.2

### Patch Changes

- Support for streaming results

## 2.0.0-usql.1

### Patch Changes

- 20127231: Bump all versions so version pinning works

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).
