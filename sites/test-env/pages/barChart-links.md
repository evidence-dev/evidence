```orders_summary
select * from needful_things.orders
limit 100
```

``` category
SELECT category, order_month AS month, sum(sales) as sales, CONCAT('/categories/', category) as category_url
FROM needful_things.orders
group by all
ORDER BY month, category
limit 250
```

<DataTable data={category}>
	<Column id=category />
	<Column id=month />
	<Column id=sales />
  <Column id=category_url contentType=link linkLabel="Details →" />
</DataTable>

<BarChart 
    data={category}
    x=month
    y=sales
    series=category
    title="Sales by Category"
    link=category_url
/>

<LineChart 
    data={category}
    x=month
    y=sales
    yAxisTitle="Sales per Month"
    title="Monthly Sales"
    series=category
    link=category_url
/>

<AreaChart 
    data={category}
    x=month
    y=sales
    series=category
    link=category_url
/>

<BubbleChart 
    data={category}
    x=month
    y=sales
    series=category
    size=sales
    link=category_url
/>

<ScatterPlot 
    data={category}
    x=month
    y=sales
    series=category
    link=category_url
/>

``` state
SELECT state, SUM(sales) AS total_sales, CONCAT('https://www.google.com/search?q=/state/', state) AS state_url
FROM needful_things.orders
GROUP BY state;
```

<USMap
	data={state}
	state=state
	value=total_sales
	link=state_url
	title="Sales by State"
/>