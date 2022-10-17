---
sidebar_position: 2
hide_title: false
hide_table_of_contents: false
title: Query Chaining
---

Query chaining enables analysts to reference the results of a query from other queries.

## Syntax
Reference other queries by writing the query name inside `${ }`.

For example, if you want to reference a query named `daily_sales`, you would write `${daily_sales}` into your SQL query.

## Example

Here we have a normal SQL query, called *sales_by_region:*

```sql
select
    region,
    sum(sales) as sales
from production.daily_sales
group by 1
```

Next, we have a query calculating average sales across regions, which references *sales_by_region* using the `${ }` syntax.

```sql
select
    avg(sales) as average_sales
from ${sales_by_region}
```

Below is the compiled SQL that's sent to the database:

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

## Presentation
You can choose whether you want to see the compiled or written SQL inside the query viewer:
![compiled-written-toggle](/img/compiled-written-toggle.gif)

## Other

The order that queries appear on the page doesn't matter to the SQL compiler. You can reference queries that appear before or after the query that you are authoring.

Some SQL dialects require sub-queries to be aliased, including Postgres and MySQL. E.g. `from ${sales_by_region} as sales_by_region`.

The SQL compiler detects circular and missing references. If a query includes either a circular reference or a missing reference, Evidence will display an error that looks like a syntax error in a normal SQL query. Queries with compiler errors are not sent to your database.

![circular-error-single](/img/circular-error-single.png)