<script>
    import { formatValue as fmt } from '$lib/modules/formatting.js';
    import KPIRow from '$lib/viz/KPIRow.svelte';
</script>


```orders
select
date_trunc('month', order_datetime) as month,
sum(sales) as sales,
count(*) as num_orders,
sum(sales) / count(*) as aov
from orders
group by month
order by month desc
```


<KPITable data={orders}/>

## Vs Last Year

<KPITable data={orders} delta pctChange comparisonRow=12/>

<KPITable data={orders} delta pctChange comparisonRow=12>
    <KPIRow id=sales format='$##0,k'/>
    <KPIRow id=num_orders/>
    <KPIRow id=aov title="AOV" format="$0.00"/>
</KPITable>


