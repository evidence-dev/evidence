---
sidebar_position: 4
title: SQL Queries
description: Markdown code fences run SQL queries, and return the results as data for components.
---

## Inline Queries

Evidence runs markdown code fences as SQL queries. These queries use the [DuckDB dialect](https://duckdb.org/docs/sql/introduction).

If you have a data source called `needful_things`, you run a query against it like this:

````markdown
```sql sales_by_category
select 
  category, sum(sales) as sales
from needful_things.orders
group by 1
```
````

When you open a page in dev mode, Evidence runs all of the queries on the page. In dev mode, Evidence monitors the contents of your SQL blocks, and reloads the page as necessary to reflect any changes you've made to your queries.

You include SQL queries in your page using a markdown code fence (starting and ending with 3 backticks). Evidence requires a query name to be supplied directly after the first 3 backticks.

### Using Query Results

Reference a query in a component using `data={query_name}`

For example, if your query name was `sales_by_category`:

```markdown
<LineChart data={sales_by_category}/>
```

## Query Chaining

Reference other queries by writing the query name inside `${ }`.

For example, if you want to reference a query named `sales_by_item`, you would write `${sales_by_item}` into your SQL query, you would write:

````sql
```sql sales_by_item
select
    item,
    sum(sales) as sales
from needful_things.orders
group by 1
```

```sql average_sales
select
    avg(sales) as average_sales
from ${sales_by_item}
```
````

Below is the compiled SQL that's sent to the database for `average_sales`:

```sql
select
    avg(sales) as average_sales
from (
    select
        item,
        sum(sales) as sales
    from needful_things.orders
    group by 1
)
```

### View Compiled SQL

You can choose whether you want to see the compiled or written SQL inside the query viewer:
![compiled-written-toggle](/img/compiled-written-toggle.gif)

### Ordering and Circular References

The order that queries appear on the page doesn't matter to the SQL compiler. You can reference queries that appear before or after the query that you are authoring.

Some SQL dialects require sub-queries to be aliased, including Postgres and MySQL. E.g. `from ${sales_by_item} as sales_by_item`.

The SQL compiler detects circular and missing references. If a query includes either a circular reference or a missing reference, Evidence will display an error that looks like a syntax error in a normal SQL query. Queries with compiler errors are not sent to your database.

![circular-error-single](/img/circular-error-single.png)

## SQL File Queries

Evidence also has support for queries outside the markdown, which is especially useful when you have a query that is being used on more than one page.

### Basic Usage

To use sql file queries, you need to place them in the `queries` directory, and then reference them in your [frontmatter](/reference/markdown/#frontmatter).

An example setup could be:

```
my-evidence-project/
  pages/
    my_page.md
  queries/
    my_file_query.sql
    some_category/
        my_category_file_query.sql
```

These queries can then be used on `my_page.md` with the following [frontmatter](/reference/markdown/#frontmatter)

```yaml
---
queries:
  - q4_data: my_file_query.sql
  - q4_sales_reps: some_category/my_category_file_query.sql
---
```

In your evidence file, you can now reference `q4_data` and `q4_sales_reps` the same way you would use any other query.

Optionally, you can omit the query name, and the filename will be used instead; these queries will be available at `my_file_query` and `some_category_my_category_file_query` (note that `/` became `_`).

```yaml
---
queries:
  - my_file_query.sql
  - some_category/my_category_file_query.sql
---
```

### Advanced Usage

#### File Query Chaining

SQL file queries can [depend on other query files](/core-concepts/queries/#query-chaining), but they will all need to be referenced in the files you use them in. For example, if `my_file_query` depends on `some_category_my_category_file_query`, then you will have to have them both in your [frontmatter](/reference/markdown/#frontmatter), as shown above.

## Query Parameters

Queries can accept parameters, which might be from an input component such as a [Dropdown](/components/inputs/dropdown), or from a URL parameter on a [template page](/core-concepts/templated-pages).

````markdown
```sql sales_by_month
select
    date_trunc('month', date) as month,
    sum(sales) as sales
from needful_things.orders
where category = '${inputs.category}'
group by 1
```
````

There are two types of parameters you can use in queries:
- **Input parameters** from components: `'${inputs.parameter_name}'`
- **URL parameters** from [templated pages](/core-concepts/templated-pages): `'${params.parameter_name}'`
