# @evidence-dev/db-commons

## 1.1.1

### Patch Changes

- 937971eaa: Package updates for CVEs. See https://github.com/evidence-dev/evidence/pull/3253

## 1.1.0

### Minor Changes

- b28f63f23: Update DuckDB to latest packages:

  - Switch to @duckdb/node-api from duckdb-async
  - Update duckdb-wasm to latest release

  This release also has small data fixes across several packages:

  - Better handling of NULL values when discovering column types
  - Fix batch processing of parquet files
  - Fix error with temporary parquet files when reloading data in dev environment

## 1.0.6

### Patch Changes

- cb5687cd9: fix(db): Fix bug that tried to read undefined db data

## 1.0.5

### Patch Changes

- 6cdedceb0: Remove db-orchestrator

## 1.0.4

### Patch Changes

- 1da26c4e: add more leniency for comments in queries

## 1.0.3

### Patch Changes

- 31381835: Add support for EVIDENCE_VAR\_\_ interpolation in source queries

## 1.0.2

### Patch Changes

- fc7fe470: Add support for closeConnection callback when async generator has completed

## 1.0.1

### Patch Changes

- Fix incorrectly published version

## 1.0.0

### Patch Changes

- bf4a112a: Update package.json to use new datasource field
- cd57ba69: Add new interface for datasources for fine-grained control of output
- c4822852: Support for streaming results
- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters
- 20127231: Bump all versions so version pinning works
- 29c149d6: added stricter types to db adapters

## 0.2.1-usql.5

### Patch Changes

- 781d2677: exhaust testconnection streams, improve type inference, add trino/databricks adapters

## 0.2.1-usql.4

### Patch Changes

- Update package.json to use new datasource field

## 0.2.1-usql.3

### Patch Changes

- cd57ba69: Add new interface for datasources for fine-grained control of output

## 0.2.1-usql.2

### Patch Changes

- Support for streaming results

## 0.2.1-usql.1

### Patch Changes

- 20127231: Bump all versions so version pinning works

## 0.2.1-usql.0

### Patch Changes

- 29c149d6: added stricter types to db adapters

## 0.2.0

### Minor Changes

- 4c04edd0: Changed expected environment variables to reduce ambiguity

## 0.1.3

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch

## 0.1.2

### Patch Changes

- bb5d0e2: changes date inference logic to cover sqlite use cases

## 0.1.1

### Patch Changes

- 942488c: patch bump for release process

## 0.1.0

### Minor Changes

- cb6d561: Native type support for MySQL, SQL Lite, and Snowflake and extracted common DB functionality to a shared package.
