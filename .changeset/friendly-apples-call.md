---
'@evidence-dev/core-components': patch
'@evidence-dev/preprocess': patch
'@evidence-dev/query-store': patch
---

QueryViewer now respects QueryStore loading staet
QueryViewer now updates when query text hmr updates

QueryStore now accepts initialError when SSR query fails

SSR / QueryStore now swallow errors unless build:strict is enabled
(e.g. the error propogates to the UI where the user can more easily find it in dev mode / regular builds)
