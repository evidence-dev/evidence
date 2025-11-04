---
"@evidence-dev/universal-sql": patch
"@evidence-dev/core-components": patch
---

Fixed base path not being applied to data file (parquet) URLs. This resolves an issue where applications deployed with a base path would fail to load data files, resulting in 404 errors.

The fix restores the dependency injection pattern for the `addBasePath` function in `setParquetURLs`, ensuring that base paths are correctly applied to all data requests in both monorepo and published package environments.

