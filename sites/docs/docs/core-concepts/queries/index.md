---
sidebar_position: 1
hide_title: false
hide_table_of_contents: false
title: SQL Queries
description: Markdown code fences run SQL queries.
---

## Writing Queries

Evidence runs markdown code fences as SQL queries.

````markdown
```sql sales_by_country
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

## Query Chaining

Reference other queries by writing the query name inside `${ }`.

For example, if you want to reference a query named `sales_by_region`, you would write `${sales_by_region}` into your SQL query, you would write:

````sql
```sql sales_by_region
select
    region,
    sum(sales) as sales
from production.daily_sales
group by 1
```

```sql average_sales
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

## SQL File Queries

Evidence also has support for queries outside the markdown, which is especially useful when you have a query that is being used on more than one page.

### Basic Usage

To use sql file queries, you need to place them in the `sources` directory, and then reference them in your [frontmatter](/markdown/#frontmatter).

An example setup could be:

```
my-evidence-project/
  pages/
    my_page.md
  sources/
    my_query.sql
    some_category/
        my_category_query.sql
```

These queries can then be used on `my_page.md` with the following [frontmatter](/markdown/#frontmatter)

```yaml
---
sources:
  - q4_data: my_query.sql
  - q4_sales_reps: some_category/my_category_query.sql
---
```

In your evidence file, you can now reference `q4_data` and `q4_sales_reps` the same way you would use any other query.

Optionally, you can omit the query name, and the filename will be used instead; these queries will be available at `my_query` and `some_category_my_category_query` (note that `/` became `_`).

```yaml
---
sources:
  - my_query.sql
  - some_category/my_category_query.sql
---
```

### Advanced Usage

#### File Query Chaining

SQL file queries can [depend on other query files](/core-concepts/queries/#query-chaining), but they will all need to be referenced in the files you use them in. For example, if `my_query` depends on `some_category_my_category_query`, then you will have to have them both in your [frontmatter](/markdown/#frontmatter), as shown above.

## Query Cache

Evidence caches query results to reduce the number of queries sent to your database.

Results from queries are cached for one hour, and identical SQL will return the cached results.

The cache is cleared at the _start_ of each build, so new builds will always use fresh data (though identical queries will only run once per build).

### Clearing the Cache Manually

Cached results are stored in your project in `.evidence/template/.evidence-queries`. You can clear the cache by deleting this directory.

```shell
rm -rf .evidence/template/.evidence-queries
```
