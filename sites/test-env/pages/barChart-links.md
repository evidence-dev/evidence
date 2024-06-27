```orders_summary
select * from needful_things.orders
limit 100
```

``` category
SELECT category, order_month AS month, SUM(sales) AS total_sales, CONCAT('/categories/', category) as category_url
FROM needful_things.orders
GROUP BY category, order_month, email
LIMIT 25;
```

<BarChart 
    data={category}
    x=month
    y=total_sales
    series=category
    title="Sales by Category"
    link='link'
/>

<DataTable data={category}>
	<Column id=category />
	<Column id=month />
	<Column id=total_sales />
  <Column id=category_url contentType=link linkLabel="Details →" />
</DataTable>