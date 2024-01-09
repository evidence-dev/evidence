---
'@evidence-dev/csv': patch
---

- Added options option to let users specify read_csv options
- Updated function to explicitly use read_csv, rather than the csv filename directly
- Defaulted read_csv to auto_detect unless otherwise specified
