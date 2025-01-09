---
title: Syntax
description: Extended markdown with additional functionality.
sidebar_position: 1
---

Evidence reports are written in **Evidence-flavored Markdown** - an extension of markdown that includes SQL queries, data viz components, and programmatic features.

If you're not familiar with markdown, it's a simple text-based syntax - you've used markdown if you've written comments in Github or typed a message in Slack.

## Markdown

Evidence supports almost all Markdown syntax. See [Markdown Reference](/reference/markdown).

```markdown
---
title: Evidence uses Markdown
---

Markdown can be used to write expressively in text.

- it supports lists,
- **bolding**, _italics_ and `inline code`,
- links to [external sites](https://google.com) and other [Evidence pages](/another/page)

## Images 🖼️

Evidence looks for images in your `static` folder, e.g. `static/my-logo.png`.
![Company Logo](/my-logo.png)
```

## SQL

Code fences in Evidence markdown files run inline queries and return data. These code fences run the [DuckDB SQL](https://duckdb.org/docs/sql/introduction) dialect. [More on Queries](/core-concepts/queries).

````markdown
```sql orders_by_month
select
    date_trunc('month', order_datetime) as order_month,
    count(*) as number_of_orders,
    sum(sales) as sales_usd
from needful_things.orders
group by 1, order by 1 desc
```
````

## Components

Evidence has a built in [component library](/components/all-components) to create charts and other visual elements. [More on Components](/core-concepts/components).

```markdown
<LineChart 
    data = {orders_by_month}    
    y = sales_usd 
    title = 'Sales by Month, USD' 
/>
```

![Line Chart](/img/syntax-line-chart.png)


## Loops

Create repeating elements by looping through data. [More on Loops](/core-concepts/loops).

```markdown
{#each orders_by_month as month}

- There were <Value data={month} column=number_of_orders/> orders in <Value data={month} />.

{/each}
```

## If / Else

Control what is displayed using data through if and else statements. [More on If / Else](/core-concepts/if-else).

```javascript
{#if orders_by_month[0].sales_usd > orders_by_month[1].sales_usd}

Sales are up month-over-month.

{:else}

Sales are down vs last month. See [category detail](/sales-by-category).

{/if}
```

## Page Variables

There are a number of variables available to access information about the current page. These are particularly useful when creating templated pages and filters. They use the syntax `{$...}`

```markdown
The current page path is: {$page.route.id}

<!-- Result: The current page path is: /core-concepts/syntax -->
```

## Frontmatter

Use frontmatter to reference SQL queries, configure how titles, breadcrumbs and the sidebar are displayed, and to set open graph metadata for link previews on X, LinkedIn, Slack, Facebook etc.

See the [Frontmatter Reference](/reference/markdown#frontmatter).

```markdown
---
title: Evidence uses Markdown
description: Evidence uses Markdown to write expressively in text.
og:
  image: /my-social-image.png
queries:
  - orders_by_month.sql
---
```

## Expressions

Curly braces execute JavaScript expressions.

```markdown
2 + 2 = {2 + 2}

<!-- Result: 2 + 2 = 4 -->

There are {orders.length} months of data.

<!-- Result: There are 36 months of data. -->

There were {orders_by_month[0].number_of_orders} orders last month.

<!-- Result: There were 3634 orders last month. -->
```


## Code Fences in Other Languages

It can be useful to include code that isn't SQL, eg for documentation or examples.

If a code fence is named one of the [reserved language names](https://github.com/evidence-dev/evidence/blob/main/packages/lib/preprocess/src/utils/supportedLanguages.cjs), such as `python` or `r`, the code fence will render a code block. The code is _not_ executed.

````markdown
```python
names = ["Alice", "Bob", "Charlie"]
for name in names:
    print("Hello, " + name)
```
````

## Partials

Partials allow you to reuse chunks of Evidence markdown. [More on Partials](/reference/markdown#partials).

`./pages/index.md`
```markdown
&#123;@partial "my-first-partial.md"&#125;

And some content specific to this page.
```

`./partials/my-first-partial.md`
```markdown
# This is my first partial

This is some content in the partial.
```
