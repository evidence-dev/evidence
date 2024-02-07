---
'@evidence-dev/core-components': major
'@evidence-dev/component-utilities': patch
'@evidence-dev/evidence': patch
'@evidence-dev/faker-datasource': patch
'@evidence-dev/plugin-connector': patch
'@evidence-dev/preprocess': patch
'@evidence-dev/universal-sql': patch
'evidence-docs': patch
'@evidence-dev/components': patch
'evidence-test-environment': patch
---

Improves input components, including adding a Date Range, and support for multi-select.

BREAKING: this changes the way you access the value of the input components.
- Previously: '${inputs.input_name.}'
- Now: '${inputs.input_name.label}', '${inputs.input_name.value}', '${inputs.input_name.start}', '${inputs.input_name.end}' etc
