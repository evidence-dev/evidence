---
'@evidence-dev/core-components': patch
---

Dropdown option store uses sharedPromise to handle concurrency / races better. Select operations now wait for options to settle (all pending adds/removes must finish first), Add / Removes now wait for flags to finish
