---
title: Loops
sidebar_position: 7
description: Create repeating elements by looping through data.
---

Create repeating elements by looping through data with `{#each}` blocks. Note that curly braces `{...}` execute JavaScript expressions in Evidence.

## Each Loops

Loops enable you to iterate over the rows in a query result, and reference the row using an alias of your choosing. They are similar to for loops in Python.

```markdown
{#each query_name as alias}

{alias.column_name}

{/each}
```

If you have more content than you would like to loop over on a single page, consider using a [templated page](/core-concepts/templated-pages).

## Example

Imagine you were creating a report on the performance of your organization's cities. You could use a loop to generate a section of your report for each city. When a new city appears in your query results, a new section will appear in your report.

The following table is being returned by the query `location_summary`

```sql location_summary
SELECT 1 as id, 'New York' as name, 9000 as sales_usd, 0.60 as gross_margin_pct UNION ALL
SELECT 2, 'Los Angeles', 5000, 0.45 UNION ALL
SELECT 3, 'Toronto', 4000, 0.70
```

<DataTable data={location_summary} formatColumnTitles=false>
    <Column id="name" />
    <Column id="sales_usd" fmt=num0 />
    <Column id="gross_margin_pct" fmt=num2 />
</DataTable>

By using an `{#each}` block, we can iterate over each of the rows in `location_summary`, and reference the current row with the alias `city`. Here we'll create a header, and a paragraph for each of the three locations.

```markdown
Daily sales:

{#each location_summary as city}

## {city.name}

<Value data={city} column=sales_usd/> in sales at a <Value data={city} column=gross_margin_pct/> gross margin.

{/each}
```

Which would result in the following output

> Daily sales:
>
> ** New York **
>
> $9,000 in sales at a 60% gross margin.
>
> ** Los Angeles **
>
> $5,000 in sales at a 45% gross margin.
>
> ** Toronto **
>
> $4,000 in sales at a 70% gross margin.
