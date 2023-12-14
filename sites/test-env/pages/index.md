<script>
    let queryString = `SELECT 5`.trim(), tempQueryString = queryString + ""
</script>

This page contains a simple demo query console for the new Universal SQL engine for Evidence.
You can view a basic explainer of the schema in the new [schema explorer](/explore/schema), this should improve over
time.

<textarea bind:value={tempQueryString} class="px-2 py-1 bg-gray-100 border border-gray-900 w-full h-72 font-mono"/>

<button on:click={() => queryString = tempQueryString} class="px-2 py-1 bg-green-800 rounded text-white">
Run Query
</button>

```q
${queryString}
```

<DataTable data={q}/>


```sql orders_by_day
select 
  date_trunc('day', order_datetime) as day,
  count(*) as orders,
  sum(sales) as sales,
  sum(sales) / count(*) as aov,
  -- growth
  lag(orders) over (order by day) as orders_last,
  lag(sales) over (order by day) as sales_last,
  count(*) / lag(count(*)) over (order by day) -1 as orders_growth,
  1.0 * sum(sales) / lag(sum(sales)) over (order by day) -1 as sales_growth,
  lag(sum(sales) / count(*)) over (order by day) as aov_last,
  1.0 * aov / aov_last -1 as aov_growth,
  1 as test
from orders
group by 1
order by 1 desc
limit 365
```

<DataTable data={orders_by_day}/>

<BarChart data={orders_by_day} x="day" y="orders" />
