---
'@evidence-dev/plugin-connector': patch
---

- connection.options.yaml values are now b64 encoded
- children that do not have a key for all child values no longer break - e.g. when ssl is disabled for postgres, there are no children. This was breaking previously
