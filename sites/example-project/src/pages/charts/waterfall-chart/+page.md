<script>
import WaterfallChart from '$lib/viz/WaterfallChart.svelte'
</script>

# Waterfall Chart

```waterfall
select 'PY Revenue' as category, 1200000 as revenue_usd, true as total
union all 
select 'New Customers' as category, 135423 as revenue_usd, false as total
union all 
select 'Upsell' as category, 25310 as revenue_usd, false as total
union all 
select 'Churn' as category, -45368 as revenue_usd, false as total
union all 
select 'Price Changes' as category, -551250 as revenue_usd, false as total
union all 
select 'CY Revenue' as category, 764115 as revenue_usd, true as total
```

<WaterfallChart 
    data={waterfall} 
    category=category 
    value=revenue_usd 
    total=total 
/>

<WaterfallChart 
    data={waterfall} 
    category=category 
    value=revenue_usd 
    total=total 
    swapXY=true
/>

