---
title: Best Practices
sidebar_position: 3
description: Tips for building performant data apps with Evidence
---

Evidence is a very flexible and open-ended tool that allows you to build almost any kind of data app. However, to get the best out of Evidence, here are some principles:

1. [Only source the data you need](#1-only-source-the-data-you-need)
2. [Sort your source queries](#2-sort-your-source-queries)
3. [Change props, not components](#3-change-props-not-components)
4. [Avoid large markdown queries](#4-avoid-large-markdown-queries)

## Source Performance

### 1. Only source the data you need

<br>
<Alert status=info>

**Best Practice:** Pre-aggregate data in your source queries, only select the columns and rows you need.

</Alert>

Every time you rebuild Evidence, it re-caches all the data from your sources. 
This can: 
- Be time-consuming and expensive to cache.
- Cause longer load times for your app, as the data comes over the network.

It's best to only source the data you need. 

### 2. Sort your source queries

<br>
<Alert status=info>

**Best Practice:** Sort your source queries. Prioritize columns that appear in `where` clauses in your markdown queries.

</Alert>


The cache in Evidence is composed of parquet files. After running `npm run sources`, you can inspect these files in `.evidence/template/static/data`.

Sorted queries lead to better compression in parquet files, resulting in faster source build times, lower likelyhood of hitting memory limits, and faster query times in your app.

If your source queries are sorted, the client-side query engine is able to take advantage of [Projection Pushdown](https://duckdb.org/2021/06/25/querying-parquet.html#automatic-filter--projection-pushdown) i.e. only loading the rows it needs.


## Interactive Performance

### 3. Change props, not components

<br>
<Alert status=info>

**Best Practice:** Use inputs to change props or change queries, not whole components.

</Alert>

If you swap out components (for example using `{#if}` blocks), Evidence will re-render the entire component. This can cause a jerky transition as the component is re-rendered.

#### Don't do this

The entire component is re-rendered when the dropdown changes:

````svelte
```sql categories
select * from categories
```

```sql products
select * from products
```

<Dropdown name=chart_picker>
    <DropdownOption value="categories"/>
    <DropdownOption value="products"/>
</Dropdown>

{#if inputs.chart_picker.value == "categories"}

    <BarChart data={categories}/>

{:else}

    <BarChart data={products}/>

{/if}
````


#### Do this
Instead, change which query the component uses with a [ternary operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator):

````svelte
```sql categories
select * from categories
```

```sql products
select * from products
```

<Dropdown name=chart_picker>
    <DropdownOption value="categories"/>
    <DropdownOption value="products"/>
</Dropdown>

<BarChart 
    data={inputs.chart_picker.value=="categories" ? categories : products}
/>
````

### 4. Avoid large markdown queries

<Alert status=warning>

**Best Practice:** Do not load return more than ~100,000 rows from queries on your page. Aggregate data in your markdown queries or source queries if needed.

</Alert>

Browsers have limited memory, and large datasets can cause slowdowns, increased rendering times and crashes. It's unlikely that you are attempting to visualize 100,000 datapoints on a webpage (an average desktop display only has ~1M pixels) so you can aggregate the data in your markdown queries, or even in you source queries.

