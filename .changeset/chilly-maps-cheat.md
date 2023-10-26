---
'@evidence-dev/universal-sql': patch
---

Queries now wait for setParquetUrls, and will time out if they are not processed within 5 seconds
