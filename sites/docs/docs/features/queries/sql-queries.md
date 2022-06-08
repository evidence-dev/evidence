---
sidebar_position: 1
hide_title: false
hide_table_of_contents: false
title: Writing Queries
---

When you open a page in dev mode, Evidence runs all of the queries on the page. You can see the progress of these queries printed in the console. In dev mode, Evidence monitors the contents of your SQL blocks, and reloads the page as necessary to reflect any changes you've made to your queries. 

## Query Blocks
You can include SQL queries in your page using a markdown code block (starting and ending with 3 backticks). Evidence requires a query name to be supplied directly after the first 3 backticks.

````markdown
```sales_by_country
select country, sum(sales) as sales
from international_transactions 
```
````

## Using Query Results
All query results on a page are returned to a single object called `data`. To use a query result, you can to reference  a subset of the `data` object. For instance if your query is named `sales_by_country`, you can reference the results using `data.sales_by_country`.  For convinience, Evidence also exposes each query result by it's own name, e.g `sales_by_country`.  These references can be used in any of the components from our built-in library.

For example, if your query name was `sales_by_country`:
```markdown
<LineChart data={sales_by_country}/>
```
or alternatively,
```markdown
<LineChart data={data.sales_by_country}/>
```

## Data Types & Formatting
The column names in your query result define how your data is treated when using components. We believe this is good practice for code readability and consistency:
- Date column names must include a date unit to be interpreted as dates in Evidence (date, week, month, qtr, year)
- Formatting is determined by **format tags** appended to your column names. See [Formatting](/features/queries/number-formatting) for more details

## Supported Databases
- BigQuery
- Snowflake
- PostgreSQL
- MySQL
- SQLite

We are accepting contributions for new database connectors. Please see [our contribution guide on GitHub](https://github.com/evidence-dev/evidence/blob/develop/CONTRIBUTING.md).