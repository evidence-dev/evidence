---
sidebar_position: 1
hide_title: false
hide_table_of_contents: false
---

# SQL Queries

When you include SQL on your page, Evidence will run the queries and send the results to your browser to be displayed on the page. The time it takes to load the page is the time it takes to run the queries on that page.

Running queries doesn't prevent you from continuing to make edits to your document.

When you change any SQL on your page, it will cause a full page reload, but Evidence only reruns queries that have changed. 

:::note Running Large Queries
Evidence supports extremely large queries, but they can be slow to run in development mode and sometimes it's difficult to see the progress as it loads. We're working on a way to give you more feedback about the progress of large queries. It's usually a good idea to use a limit clause in your SQL to avoid these issues.
:::

## Supported Databases
- BigQuery
- Snowflake
- PostgreSQL

We are accepting contributions for new database connectors. Please see [our contribution guide on GitHub](https://github.com/evidence-dev/evidence/blob/develop/CONTRIBUTING.md).

## Query Blocks
You can include SQL queries in your page using a markdown code block (starting and ending with 3 backticks). Evidence requires a query name to be supplied directly after the first 3 backticks.
````markdown
```data_sample
select country, sum(sales) as sales
from international_transactions 
```
````

## Using Query Results
All query results on a page are returned to a single object called `data`. To use a query result, you need to reference the query name as a subset of that `data` object. These references can be used in any of the components from our built-in library.

For example, if your query name was `sales_by_country`:
```
<LineChart data={data.sales_by_country}/>
```

## Data Types & Formatting
The column names in your query result define how your data is treated when using components. We believe this is good practice for code readability and consistency:
- Date column names must include a date unit to be interpreted as dates in Evidence (date, week, month, qtr, year)
- Formatting is determine by **format tags** appended to your column names. See [Formatting](/formatting/format-tags) for more details

## Query Chaining - Coming Soon
At this time, you cannot run a query against the result of another query. This feature is a top priority and is currently in development.