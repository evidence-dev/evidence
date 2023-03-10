---
title: Syntax
description: Extended markdown with additional functionality.
---

_Evidence-flavored Markdown_ extends standard markdown with additional functionality.

## Markdown

Evidence supports almost all Markdown syntax. For more details see the [Markdown Reference](/markdown).


```markdown
# Evidence uses Markdown

Markdown can be used to write expressively in text.
- it supports lists,
- **bolding** and *italics*
- ~~strikethroughs~~ and `inline code`

## Links 🔗

You can drop in links to [other Evidence pages](/another-page) and [external resources](https://google.com)

## Images 🖼️

Evidence looks for images saved in your `static` folder, eg `static/my-logo.png`.
You can also include online images by URL.

![Company Logo](my-logo.png)
```

## Code Fences

Markdown code fences in Evidence run SQL queries and return data. The SQL dialect used is the same as the database you're connecting to.

````markdown
```orders
select 
    date_trunc('year', order_datetime) as year,
    sum(sales) as sales_usd
from orders
group by 1
```
````

The exception is if you name your code fence with one of the [reserved language names](https://github.com/evidence-dev/evidence/blob/main/packages/preprocess/supportedLanguages.cjs), such as `python` or `r`. In this case, the code fence will render a code block.

````markdown
```python
names = ["Alice", "Bob", "Charlie"]
for name in names:
    print("Hello, " + name)
```
````

## Components

Evidence supports a number of components that are used to create charts and other visual elements.

```markdown
<LineChart data={orders} />
```

## Expressions

Curly braces execute JavaScript expressions.

```markdown
2 + 2 = {2 + 2} 
<!-- Result: 2 + 2 = 4 -->

There are {orders.length} years of data.  
<!-- Result: There are 3 years of data. -->

The first year is {orders[0].year}. 
<!-- Result: The first year is 2020. -->
```


## Control Statements

You can control what is displayed in your pages using conditional statements and loops.

```markdown
{#if orders.length > 0}

<DataTable data={orders} />

{:else}
  
There is no order data.

{/if}
```

## Page Variables

There are a number of variables available to access information about the current page.

```markdown
The current page path is: {$page.path} 
<!-- Result: The current page path is: /core-concepts/syntax/ -->
```