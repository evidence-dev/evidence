---
sidebar_position: 1
hide_title: false
hide_table_of_contents: false
title: Queries
description: Markdown code fences run SQL queries.
---

## Writing Queries

Evidence runs markdown code fences as SQL queries.

````markdown
```sales_by_country
select country, sum(sales) as sales
from international_transactions
group by 1
```
````

When you open a page in dev mode, Evidence runs all of the queries on the page. You can see the progress of these queries printed in the console. In dev mode, Evidence monitors the contents of your SQL blocks, and reloads the page as necessary to reflect any changes you've made to your queries.

You can include SQL queries in your page using a markdown code fence (starting and ending with 3 backticks). Evidence requires a query name to be supplied directly after the first 3 backticks.

### Using Query Results
Reference a query in a component using `data={query_name}`

For example, if your query name was `sales_by_country`:

```markdown
<LineChart data={sales_by_country}/>
```

Query chaining enables analysts to reference the results of a query from other queries.

## Query Chaining

Reference other queries by writing the query name inside `${ }`.

For example, if you want to reference a query named `sales_by_region`, you would write `${sales_by_region}` into your SQL query, you would write:


````sql
```sales_by_region
select
    region,
    sum(sales) as sales
from production.daily_sales
group by 1
```

```average_sales
select
    avg(sales) as average_sales
from ${sales_by_region}
```
````

Below is the compiled SQL that's sent to the database for `average_sales`:

```sql
select
    avg(sales) as average_sales
from (
    select
        region,
        sum(sales) as sales
    from production.daily_sales
    group by 1
)
```

### View Compiled SQL

You can choose whether you want to see the compiled or written SQL inside the query viewer:
![compiled-written-toggle](/img/compiled-written-toggle.gif)

### Ordering and Circular References

The order that queries appear on the page doesn't matter to the SQL compiler. You can reference queries that appear before or after the query that you are authoring.

Some SQL dialects require sub-queries to be aliased, including Postgres and MySQL. E.g. `from ${sales_by_region} as sales_by_region`.

The SQL compiler detects circular and missing references. If a query includes either a circular reference or a missing reference, Evidence will display an error that looks like a syntax error in a normal SQL query. Queries with compiler errors are not sent to your database.

![circular-error-single](/img/circular-error-single.png)


## Data Types & Formatting
The column names in your query result define how your data is treated when using components.

- Date column names must include a date unit to be interpreted as dates in Evidence (date, week, month, qtr, year)
- Formatting is determined by **format tags** appended to your column names. See [Formatting](../formatting) for more details


## Supported Databases
- BigQuery
- Snowflake
- PostgreSQL
- MySQL
- SQLite
- DuckDB
- [CSV files](/core-concepts/data-sources/#use-local-csvs)

We are accepting contributions for new database connectors. Please see [our contribution guide on GitHub](https://github.com/evidence-dev/evidence/blob/develop/CONTRIBUTING.md).
