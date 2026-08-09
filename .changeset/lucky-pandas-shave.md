---
'@evidence-dev/core-components': patch
---

Draw non-interactive sparklines as plain SVG instead of creating an ECharts instance per sparkline. Fixes multi-second main-thread freezes on pages with many DataTable sparkline columns, which are severe in Safari/WebKit.
