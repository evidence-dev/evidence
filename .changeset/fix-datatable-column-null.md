---
"@evidence-dev/core-components": patch
---

Fix DataTable not rendering rows when data is loaded asynchronously

Added null check in Column.svelte's checkColumnName() function to guard against data not being ready during initial render. This fixes an issue where DataTable would show the table container (search box, pagination) but no actual rows when using Query objects or when data loads asynchronously.
