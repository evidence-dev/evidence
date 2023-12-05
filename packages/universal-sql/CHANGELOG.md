# @evidence-dev/universal-sql

## 2.0.0-usql.15

### Patch Changes

- b25a95d7: Misc fixes

## 2.0.0-usql.14

### Patch Changes

- fd74bd3c: Prevent queries with the same name from different connectors from colliding

## 2.0.0-usql.13

### Patch Changes

- b5592a3f: Usability Improvements

## 2.0.0-usql.12

### Patch Changes

- 0ba78b67: polish working with sources
- cd57ba69: Add new interface for datasources for fine-grained control of output

## 2.0.0-usql.11

### Minor Changes

- 52d81ce2: fix parameterized page prerendering

### Patch Changes

- 130950d7: add client/build time guardrails

## 2.0.0-usql.10

### Patch Changes

- Support for streaming results

## 2.0.0-usql.9

### Patch Changes

- 52e114cc: move date standardization

## 2.0.0-usql.8

### Patch Changes

- 20127231: Bump all versions so version pinning works

## 2.0.0-usql.7

### Patch Changes

- 69126c94: change internal filename generation

## 2.0.0-usql.6

### Patch Changes

- Queries now wait for setParquetUrls, and will time out if they are not processed within 5 seconds

## 2.0.0-usql.5

### Patch Changes

- Don't count the database as initialized until parquet urls are set (tables are created)

## 2.0.0-usql.4

### Patch Changes

- Reduce risk of queries attempting to execute prior to database initialization

## 2.0.0-usql.3

### Patch Changes

- ca7337ba: fix prerendering for all pages

## 2.0.0-usql.2

### Patch Changes

- 9b1ac9b7: make everything use a single connection

## 2.0.0-usql.1

### Minor Changes

- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering

### Patch Changes

- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).
