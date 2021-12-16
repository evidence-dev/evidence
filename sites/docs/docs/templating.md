---
sidebar_position: 5
hide_table_of_contents: false
title: Templating
---
Templating allows you to use your data to control the structure of your reports. This enables you to build automated reports that will feel like handwritten analysis to your audience. 

## Text expressions 
In Evidence, curly braces like these `{...}` evaluate javascript. In most cases, you will want to pass data into a componet such as `<Value/>` or `<LineChart/>`, but text expressions can be very handy. You don't need to be an expert in javascript to use text expressions, and the possibilities are nearly endless. 

## Examples

* Doing math: `{5+5}` will show up as "10" in your report. 
* Dynamically getting the number of records from a query result: `{data.example_query.length}` will display the number of rows returned by `example_query`
* Using a [conditional](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator) to create a colloquial explanation of what's going on: 

```
We are {data.revenue_growth[0].projected_vs_target >= 0 ? "on track for " : "behind"} our revenue growth target.
```

Will resolve to "We are on track for our revenue growth target." or "We are behind our revenue growth target." depending on the results of the `revenue_growth` query. 

## Loops

Loops enable you to iterate over the rows in a query result, and reference the row using an alias of your choosing. 

```markdown
{#each data.query as alias}

{alias.column_name}

{/each}
```

If you have more content than you would like to loop over on a single page, consider using a [paramaterized page](/paramaterized-pages). 

### Example 

Imagine you were creating a report on the performance of your organization's locations. You could use a loop to generate a section of your report for each location. When a new location appears in your query results, a new section will appear in your report.

The following table is being returned by the query `location_summary` 

|id   |name   |sales_usd  |gross_margin_pct   
|---|---|---|---|
|1   |New York   |900   |0.6   |   
|2  |Los Angeles   |500   |0.45   |   
|3   |Toronto   |400   |0.7   |   


By using an `{#each}` block, we can iterate over each of the rows in `location_summary`, and reference the current row with the alias `location`. Here we'll create a header, and a paragraph for each of the three locations.

```markdown 
{#each data.location_summary as location}

## {location.name} 
Generated <Value value={location.sales_usd}/> at a <Value value={location.gross_margin_pct}/> gross margin. 

{/each}
```


## Conditionals

Conditionals are critical tool for managing information overload, and ensuring that your reporting is consistently showing actionable information. 

Conditionals allow you to show a section of your document if a condition is met. You can optionally include `{:else}` and `{:else if}` blocks inside of your `{#if}...{/if}` blocks.

```json 
{#if condition}

Display this content. 

{:else if another condition}

A different piece of content. 

{:else }

Finally, this last piece of content.

{/if}
```

### Example 

Imagine you only wanted to encourage your sales leaders to focus on cross-selling low margin customers when there were enough low-margin customers to do that work in-bulk. You could use a conditional to do something like this. 

```json
{#if data.low_margin_customers.length > 15}

The following customers are generating low margins, consider re-allocating an account management call block to cross-sell these customers. 

<Table data={data.low_margin_customers/>

{:else }

There are fewer than fifteen low margin customers, contract renegotiations are not a priority at this time. 

{/if}
```

Content that is conditionally rendered can be wrapped in an if block.

Additional conditions can be added with {:else if expression}, optionally ending in an {:else} clause.


```json title="Conditional based on query returning a result"
{#if data.query_name[0]}

Display this text.

{:else }

Display this other text.

{/if}
```