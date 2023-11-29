# @evidence-dev/faker-datasource

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
