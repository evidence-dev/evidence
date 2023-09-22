---
'@evidence-dev/evidence': major
'@evidence-dev/preprocess': major
'@evidence-dev/query-store': major
---

Add QueryStore concept

- Loads data as it is requested, rather than all at page-load / build
- Uses duckdb to get data length / column data
- Ties metadata, mutation queries, and data together to make component development easier
- Provides information regarding loading (and query errors in the future)
