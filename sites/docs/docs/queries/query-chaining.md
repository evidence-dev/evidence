---
sidebar_position: 2
hide_title: false
hide_table_of_contents: false
---

# Query Chaining
Query chaining enables analysts to reference the results of a query from other queries.

## Syntax
Reference other queries by writing the query name inside `${ }`.

For example, if you want to reference a query named *first_query*, you would write `${first_query}`.

The SQL compiler ignores whitespace on either side of the query name, so you can include spaces if you prefer that format. The above example would become `${ first_query }`.

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

## Execution Order
The Evidence SQL compiler does not follow an execution order, meaning you can reference queries that exist anywhere else on your page (you're not restricted to queries above your current query). 

The SQL compiler will also detect circular references. If a query includes a circular reference, Evidence will print an error to your console and produce an error inside the query viewer, without stopping your page from running:

![circular-error-single](/img/circular-error-single.png)
