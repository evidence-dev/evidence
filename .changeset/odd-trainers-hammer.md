---
'@evidence-dev/core-components': patch
'@evidence-dev/plugin-connector': patch
---

- QueryStatus only notifies once now
- Source HMR uses a path-specific queue to prevent queuing a file twice, and prevent running more than one source command at a time
