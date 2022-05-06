---
title: Text expressions 
sidebar_position: 1
---

In Evidence, curly braces like these `{...}` evaluate javascript. In most cases, you will want to pass data into a componet such as `<Value/>` or `<LineChart/>`, but text expressions can be very handy. You don't need to be an expert in javascript to use text expressions, and the possibilities are nearly endless. 

#### Examples

* Doing math: `{5+5}` will show up as "10" in your report. 
* Dynamically getting the number of records from a query result: `{data.example_query.length}` will display the number of rows returned by `example_query`.
* Using a [conditional](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator) to create a colloquial explanation of what's going on: 

```
We are {data.revenue_growth[0].projected_vs_target >= 0 ? "on track for " : "behind"} our revenue growth target.
```

Will resolve to "We are on track for our revenue growth target." or "We are behind our revenue growth target." depending on the results of the `revenue_growth` query. 
