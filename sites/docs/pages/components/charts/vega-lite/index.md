---
title: Vega-Lite Chart
description: Render arbitrary Vega-Lite specifications while still benefiting from Evidence queries, loading states, and theming.
sidebar_position: 25
---

Evidence ships a lightweight Vega-Lite wrapper for scenarios where the built-in ECharts components are not flexible enough. Supply a Vega-Lite specification via the `spec` prop and Evidence will inject the rows from your `data` query into the spec (unless you explicitly set `spec.data` yourself).

```sql orders_by_month
select
    date_trunc('month', order_datetime) as month,
    count(*) as num_orders,
    sum(sales) as sales,
    sum(sales) / count(*) as aov
from needful_things.orders
group by 1
order by 1
```

```sql sales_by_category
select
    date_trunc('month', order_datetime) as month,
    category,
    sum(sales) as sales
from needful_things.orders
group by 1, 2
order by 1, 2
```

<DocTab>
    <div slot='preview'>
        <VegaLiteChart
            data={orders_by_month}
            spec={{
                mark: { type: 'bar', tooltip: true },
                encoding: {
                    x: { field: 'month', type: 'temporal', title: 'Month' },
                    y: { field: 'sales', type: 'quantitative', title: 'Sales (USD)' }
                }
            }}
            title="Monthly Sales"
            subtitle="Spec defined inline"
        />
    </div>

```svelte
<VegaLiteChart
    data={orders_by_month}
    spec={{
        mark: { type: 'bar', tooltip: true },
        encoding: {
            x: { field: 'month', type: 'temporal', title: 'Month' },
            y: { field: 'sales', type: 'quantitative', title: 'Sales (USD)' }
        }
    }}
    title="Monthly Sales"
    subtitle="Spec defined inline"
/>
```
</DocTab>

## Examples

### Multi-series line

<DocTab>
    <div slot='preview'>
        <VegaLiteChart
            data={sales_by_category}
            spec={{
                mark: { type: 'line', interpolate: 'monotone' },
                encoding: {
                    x: { field: 'month', type: 'temporal' },
                    y: { field: 'sales', type: 'quantitative', title: 'Sales (USD)' },
                    color: { field: 'category', type: 'nominal', legend: { title: 'Category' } }
                }
            }}
            title="Sales by Category"
            subtitle="Uses Evidence query rows directly"
        />
    </div>

```svelte
<VegaLiteChart
    data={sales_by_category}
    spec={{
        mark: { type: 'line', interpolate: 'monotone' },
        encoding: {
            x: { field: 'month', type: 'temporal' },
            y: { field: 'sales', type: 'quantitative', title: 'Sales (USD)' },
            color: { field: 'category', type: 'nominal', legend: { title: 'Category' } }
        }
    }}
    title="Sales by Category"
    subtitle="Uses Evidence query rows directly"
/>
```
</DocTab>

### Disable toolbar actions

Pass any `vega-embed` options (such as `actions` or `renderer`) straight through as props.

<DocTab>
    <div slot='preview'>
        <VegaLiteChart
            data={orders_by_month}
            actions={false}
            renderer="svg"
            spec={{
                mark: { type: 'area', line: { color: '#6366f1' }, color: { value: '#c7d2fe' } },
                encoding: {
                    x: { field: 'month', type: 'temporal' },
                    y: { field: 'num_orders', type: 'quantitative', title: 'Orders' }
                }
            }}
        />
    </div>

```svelte
<VegaLiteChart
    data={orders_by_month}
    actions={false}
    renderer="svg"
    spec={{
        mark: { type: 'area', line: { color: '#6366f1' }, color: { value: '#c7d2fe' } },
        encoding: {
            x: { field: 'month', type: 'temporal' },
            y: { field: 'num_orders', type: 'quantitative', title: 'Orders' }
        }
    }}
/>
```
</DocTab>

:::note
Reference the [Vega-Lite documentation](https://vega.github.io/vega-lite/docs/) for the full spec schema. Evidence simply hands your spec to `vega-embed`, so anything supported upstream will work here.
:::
