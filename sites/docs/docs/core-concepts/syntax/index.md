---
title: Syntax
description: Extended markdown with additional functionality.
---

_Evidence flavored Markdown_ extends markdown with additional functionality.

## Markdown

Evidence supports almost all Markdown syntax. See [Markdown Reference](/markdown).

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
![Company Logo](my-logo.png)
```

## SQL

Markdown code fences in Evidence run SQL queries and return data. The SQL dialect matches the database you're connecting to. [More on Queries](/core-concepts/queries).

````markdown
```sql orders_by_month
select
    date_trunc('month', order_datetime) as order_month,
    count(*) as number_of_orders,
    sum(sales) as sales_usd
from orders
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

## Loops

Create repeating elements by looping through data. [More on Loops](/core-concepts/loops).

```markdown
{#each orders_by_month as month}

- There were <Value data={month} column=number_of_orders/> orders in <Value data={month} />.

{/each}
```

## If / Else

Control what is displayed using data through if and else statements. [More on If / Else](/core-concepts/if-else).

```js
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

<!-- Result: The current page path is: /core-concepts/syntax/ -->
```

## Code Fences in Other Languages

It can be useful to include code that isn't SQL, eg for documentation or examples.

If a code fence is named one of the [reserved language names](https://github.com/evidence-dev/evidence/blob/main/packages/preprocess/supportedLanguages.cjs), such as `python` or `r`, the code fence will render a code block. The code is _not_ executed.

````markdown
```python
names = ["Alice", "Bob", "Charlie"]
for name in names:
    print("Hello, " + name)
```
````
