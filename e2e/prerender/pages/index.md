---
title: Welcome to Evidence
---

<script>
	import { buildQuery } from "@evidence-dev/component-utilities/buildQuery";

	const nonssr_query = buildQuery("SELECT category, COUNT(*) as count FROM needful_things.orders GROUP BY category", "nonssr");
	const ssr_query = buildQuery("SELECT category, COUNT(*) * 2 as count FROM needful_things.orders GROUP BY category", "ssr", data.ssr_data, { knownColumns: data.ssr_columns });

	// replicate chart double loading
	setTimeout(() => {
		sales_month = sales_month;
	}, 1400);
</script>

```sql sales_month
select date_trunc('month', order_datetime) as x, sum(sales) as y
from needful_things.orders
group by x
```

<BarChart data={sales_month} title="Sales by Month" x=x y=y />

{#if !$nonssr_query.loading}

<span data-testid="loaded-1">{JSON.stringify($nonssr_query)}</span>

{:else}

<span data-testid="loading-1">Loading...</span>

{/if}

{#if !$ssr_query.loading}

<span data-testid="loaded-2">{JSON.stringify($ssr_query)}</span>

{:else}

<span data-testid="loading-2">Loading...</span>

{/if}

<DataTable data={ssr_query} />

<Details title='How to edit this page'>

This page can be found in your project at `/pages/index.md`. Make a change to the markdown file and save it to see the change take effect in your browser.

</Details>

```sql categories
  select
      category
  from needful_things.orders
  group by category
```

<span data-testid="category-count">{categories.length}</span>
<span data-testid="category-0">{JSON.stringify(categories[0])}</span>

<Dropdown data={categories} name=category value=category>
    <DropdownOption value="%" valueLabel="All Categories"/>
</Dropdown>

<Dropdown data={categories} name=category2 value=category />

<Dropdown name=year>
    <DropdownOption value=% valueLabel="All Years"/>
    <DropdownOption value=2019/>
    <DropdownOption value=2020/>
    <DropdownOption value=2021/>
</Dropdown>

<Dropdown name=year2>
    <DropdownOption value=2019/>
    <DropdownOption value=2020/>
    <DropdownOption value=2021/>
</Dropdown>

```sql orders_by_category
  select
      date_trunc('month', order_datetime) as month,
      sum(sales) as sales_usd,
      category
  from needful_things.orders
  where category like '${inputs.category.value}'
  and date_part('year', order_datetime) like '${inputs.year.value}'
  group by all
  order by sales_usd desc
```

<DataTable data={orders_by_category} />

<BarChart
    data={orders_by_category}
    x=month
    y=sales_usd
    series=category
/>

## What's Next?

- [Connect your data sources](settings)
- Edit/add markdown files in the `pages` folder
- Deploy your project with [Evidence Cloud](https://evidence.dev/cloud)

## Get Support

- Message us on [Slack](https://slack.evidence.dev/)
- Read the [Docs](https://docs.evidence.dev/)
- Open an issue on [Github](https://github.com/evidence-dev/evidence)
