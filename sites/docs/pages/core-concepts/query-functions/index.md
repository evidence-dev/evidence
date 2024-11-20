---
title: Query Functions
sidebar_position: 11
description: Query functions allow you to operate on query results with SQL-like syntax.
---

```sql orders
SELECT id, order_datetime, first_name, last_name, sales, category, item FROM orders
```


Query functions allow you to operate on query results with SQL-like syntax.


<Alert status="warning">

**Warning** 

Query functions are experimental and may change in the future.

</Alert>

The supported query functions are:

- [``.where(`sqlStatement`)``](#where)
- [`.groupBy([columns], withRowCount = true)`](#groupby)
- [`.limit(limit)`](#limit)
- [`.offset(offset)`](#offset)
- [`.agg({aggObj})`](#agg)


## Where
``.where(`sqlStatement`)``

Filters rows in the query based on the provided condition.

```markdown
<DataTable data={orders.where(`sales > 100`)} />
```

#### Parameters

<PropListing
    name="sqlStatement"
    description="A SQL-like condition to filter rows, must be wrapped in backticks."
    required
/>

### Iterating through a query

````markdown
```sql categories
SELECT DISTINCT category FROM orders
```

```sql orders_by_category
SELECT 
    category,
    item,
    sum(sales) as total_sales
FROM orders 
group by all
```

{#each categories as category}

    <BarChart data={orders_by_category.where(`category = '${category}'`)} />

{/each}
````

```sql categories
SELECT DISTINCT category FROM orders
```

```sql orders_by_category
SELECT 
    category,
    item,
    sum(sales) as total_sales
FROM orders 
group by all
```

<Details title='Example Output'>

{#each categories as category}

    <BarChart 
        data={orders_by_category.where(`category = '${category.category}'`)} 
        x="item"
        y="total_sales"
        title={`${category.category} Sales`}
    />

{/each}

</Details>

## GroupBy
``.groupBy([columns], withRowCount = true)``

Groups rows by the specified columns and optionally includes a row count.

```markdown
<DataTable data={orders.groupBy(["category", "item"])} />
```

#### Parameters

<PropListing
    name="columns"
    description="The columns to group by."
    required
/>

<PropListing
    name="withRowCount"
    description="Whether to include a `rows` column indicating the count of rows in each group."
/>

## Limit
``.limit(limit)``

Limits the number of rows returned by the query.

```markdown
<DataTable data={orders.limit(5)} />
```

#### Parameters

<PropListing
    name="limit"
    description="Maximum number of rows."
    required
/>


## Offset
``.offset(offset)``

Skips a specified number of rows in the query result.


```markdown
<DataTable data={orders.offset(20)} />
```

#### Parameters

<PropListing
    name="offset"
    description="Number of rows to skip."
    required
/>

## Agg
``.agg({aggObj})``

Adds aggregation operations to the query (e.g., `sum`, `avg`, `min`, `max`, `median`). Used in conjunction with [`groupBy`](#groupby).


```markdown
<DataTable 
    data={orders.groupBy(["category", "item"]).agg({sum: "sales"})}
/>
```

#### Parameters

<PropListing
    name="aggObj"
    required    
>

    Configuration object where keys are aggregation functions (`sum`, `avg`, `min`, `max`, `median`) and values are column specifications.

</PropListing>