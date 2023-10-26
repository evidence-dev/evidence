---
'@evidence-dev/bigquery': major
'@evidence-dev/component-utilities': major
'@evidence-dev/core-components': major
'@evidence-dev/csv': major
'@evidence-dev/db-orchestrator': major
'@evidence-dev/duckdb': major
'@evidence-dev/evidence': major
'@evidence-dev/faker-datasource': major
'@evidence-dev/mssql': major
'@evidence-dev/mysql': major
'@evidence-dev/plugin-connector': major
'@evidence-dev/postgres': major
'@evidence-dev/preprocess': major
'@evidence-dev/redshift': major
'@evidence-dev/snowflake': major
'@evidence-dev/sqlite': major
'@evidence-dev/universal-sql': major
'@evidence-dev/components': major
'evidence-test-environment': major
---

This update includes major changes to the way Evidence interacts with data.
Instead of running queries against the production database, and including it
with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

.parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).
