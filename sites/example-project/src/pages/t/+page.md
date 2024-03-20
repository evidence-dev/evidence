---
title: Hello World!!!
queries:
- orders_by_category: orders_by_category.sql
---

Hello World


This page is accompanied by a `test.js` file that preprocesses it and writes the result to `page.svelte`.
It _only_ uses the `@evidence-dev/preprocess` package, but is useful for viewing the result of the preprocessor for a given case.


```sql test_query
SELECT 5
```