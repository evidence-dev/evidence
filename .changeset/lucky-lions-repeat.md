---
'@evidence-dev/core-components': patch
---

Fix inputs staying unset (and their queries loading forever) when a `defaultValue` written in markdown does not strictly equal the value coming from a query.

Markdown props are always strings, so `defaultValue=2026` never matched the number `2026` returned by a query. `ButtonGroupItem` and the dropdown option store now compare default values by value instead of by identity, and `ButtonGroup` seeds its input synchronously so queries depending on it are not created against an unset input while the button group's own query is still resolving.

Fixes #1479, fixes #2024.
