---
title: Time Series Panel
sidebar_position: 1
queries: 
- orders_by_day.sql
---

```sql data2
SELECT order_month 
FROM orders 
ORDER BY order_month ASC
```

```sql data3
SELECT 
	"order_month", 
	greatest(200,count(*)*power(1.001,row_number() OVER ())) AS "ARR", 
	count(*)-100*power(1.002,row_number() OVER ()) AS "WAU", 
	count(*)*power(1.004,row_number() OVER ()) AS "Cloud WAU", 
	count(*)-100*power(1.001,row_number() OVER ()) AS "Week 4 Retention", 
	count(*)*power(1.009,row_number() OVER ()) AS "GH Stars" 
	FROM (
		SELECT order_month 
FROM orders 
ORDER BY order_month ASC) AS subquery GROUP BY "order_month"
```

<DocTab>
    <div slot='preview'>
    <TimeSeriesPanel
		data={data2}
		x="order_month"
	>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="ARR"
			link="http://www.google.com"
			fmt="usd2"
		/>
		<Metric
			metric="count(*)-100*power(1.002,row_number() OVER ())"
			label="WAU"
			link="http://www.google.com"
			fmt="num0"
		/>
		<Metric
			metric="count(*)*power(1.004,row_number() OVER ())"
			label="Cloud WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)-100*power(1.001,row_number() OVER ())"
			label="Week 4 Retention"
			link="http://www.google.com"
			fmt="num0"
		/>
		<Metric
			metric="count(*)*power(1.009,row_number() OVER ())"
			label="GH Stars"
			link="http://www.google.com"
			fmt="num2"
		/>
	</TimeSeriesPanel>
    </div>

```markdown
<TimeSeriesPanel
	data={data2}
	x='order_month'
>
	<Metric
		metric='greatest(200,count(*)*power(1.001,row_number() OVER ()))'
		label='ARR'
		link='http://www.google.com'
		fmt='usd2'
	/>
	<Metric
		metric='count(*)-100*power(1.002,row_number() OVER ())'
		label='WAU'
		link='http://www.google.com'
		fmt='num0'
	/>
	<Metric
		metric='count(*)*power(1.004,row_number() OVER ())'
		label='Cloud WAU'
		link='http://www.google.com'
	/>
	<Metric
		metric='count(*)-100*power(1.001,row_number() OVER ())'
		label='Week 4 Retention'
		link='http://www.google.com'
		fmt='num0'
	/>
	<Metric
		metric='count(*)*power(1.009,row_number() OVER ())'
		label='GH Stars'
		link='http://www.google.com'
		fmt='num2'
	/>
</TimeSeriesPanel>
```
</DocTab>

## Options

<PropListing
    name=""  
    options={null}
>
</PropListing>