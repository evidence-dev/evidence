---
'@evidence-dev/component-utilities': patch
---

- buildReactiveInputQuery was accidentally setting the value of it's store to a Promise, which was not the intent. This ensures that the value is always the proper interface.
