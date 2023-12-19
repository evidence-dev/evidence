---
'@evidence-dev/core-components': patch
---

Makes most "truthy" props reactive.
Due to the wrapping, it seems that the type gets caught as a string somewhere along the line (likely becase the query finishes running)
This causes it to revert to truthy.
