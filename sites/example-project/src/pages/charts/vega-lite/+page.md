---
title: Vega-Lite Chart
queries:
  - orders_by_month: orders_by_month.sql
  - orders_by_category: orders_by_category.sql
---

Evidence’s Vega-Lite wrapper lets you drop any [Vega-Lite spec](https://vega.github.io/vega-lite/) straight into your markdown and bind it to a query.

## Simple bar spec

<VegaLiteChart
    data={orders_by_month}
    spec={{
        mark: { type: 'bar', tooltip: true },
        encoding: {
            x: { field: 'month', type: 'temporal', title: 'Month' },
            y: { field: 'sales_usd0k', type: 'quantitative', title: 'Sales (000s USD)' }
        }
    }}
    title="Monthly Sales with Vega-Lite"
    subtitle="Inline spec, Evidence data"
/>

## Multi-series line spec

<VegaLiteChart
    data={orders_by_category}
    spec={{
        mark: { type: 'line', interpolate: 'monotone' },
        encoding: {
            x: { field: 'month', type: 'temporal', title: 'Month' },
            y: { field: 'sales_usd0k', type: 'quantitative', title: 'Sales (000s USD)' },
            color: { field: 'category', type: 'nominal', legend: { title: 'Category' } }
        }
    }}
    title="Category Trendlines"
/>

## Custom renderer and toolbar

<VegaLiteChart
    data={orders_by_month}
    renderer="svg"
    actions={false}
    spec={{
        mark: { type: 'area', interpolate: 'basis', color: { value: '#60a5fa' }, opacity: 0.8 },
        encoding: {
            x: { field: 'month', type: 'temporal' },
            y: { field: 'num_orders_num0', type: 'quantitative', title: 'Orders' }
        }
    }}
    title="Orders Trend (SVG renderer, no toolbar)"
/>
