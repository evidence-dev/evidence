---
'@evidence-dev/query-store': patch
---

When fetching data for the 2nd time, the result promise from the first instance is returned, instead of undefined
