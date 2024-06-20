---
title: testing
sidebar_position: 999999
queries: 
- orders_with_comparisons.sql
---

Big Value displays a large value, and can be configured to include a comparison and a sparkline.


<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  sparkline=month
  comparison=order_growth
  comparisonFmt=pct1
  comparisonTitle="vs. Last Month"
  url='/components/big-value/'
/>



```sql orders
Select sum(sales) as total_sales FROM needful_things.orders
```

```sql fares
Select sum(fare) as total_fares FROM memory.series_demo_source.flights
```

<BigValue data={orders} value=total_sales />