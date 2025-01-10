---
title: Time Series Panel
sidebar_position: 1
queries: 
- orders_by_day.sql
---

```sql data2
SELECT order_month, sales
FROM orders 
```

<DocTab>
    <div slot='preview'>

		<TimeSeriesPanel
			data={data2}
			x="order_month"
		>
			<Metric
				metric="sum(sales)"
				label="ARR"
				link="https://www.google.com/search?q=ARR"
				fmt="usd2"
			/>
			<Metric
				metric="count(*)-100*power(1.002,row_number() OVER ())"
				label="WAU"
				link="https://www.google.com/search?q=WAU"
				fmt="num0"
			/>
			<Metric
				metric="count(*)*power(1.004,row_number() OVER ())"
				label="Cloud WAU"
				link="https://www.google.com/search?q=Cloud WAU"
			/>
			<Metric
				metric="count(*)-100*power(1.001,row_number() OVER ())"
				label="Week 4 Retention"
				link="https://www.google.com/search?q=Week 4 Retention"
				fmt="num0"
			/>
			<Metric
				metric="count(*)*power(1.009,row_number() OVER ())"
				label="GH Stars"
				link="https://www.google.com/search?q=GH Starts"
				fmt="num2"
			/>
		</TimeSeriesPanel>
		
    </div>

```markdown
		<TimeSeriesPanel
			data={data2}
			x="order_month"
		>
			<Metric
				metric="sum(sales)"
				label="ARR"
				link="https://www.google.com/search?q=ARR"
				fmt="usd2"
			/>
			<Metric
				metric="count(*)-100*power(1.002,row_number() OVER ())"
				label="WAU"
				link="https://www.google.com/search?q=WAU"
				fmt="num0"
			/>
			<Metric
				metric="count(*)*power(1.004,row_number() OVER ())"
				label="Cloud WAU"
				link="https://www.google.com/search?q=Cloud WAU"
			/>
			<Metric
				metric="count(*)-100*power(1.001,row_number() OVER ())"
				label="Week 4 Retention"
				link="https://www.google.com/search?q=Week 4 Retention"
				fmt="num0"
			/>
			<Metric
				metric="count(*)*power(1.009,row_number() OVER ())"
				label="GH Stars"
				link="https://www.google.com/search?q=GH Starts"
				fmt="num2"
			/>
		</TimeSeriesPanel>
```
</DocTab>

# TimeSeriesPanel

## Options

<PropListing
    name="data"  
	description="Query name, wrapped in curly braces"  
    options="query name"
/>
<PropListing
    name="x"  
    options='column name'
	description="Column to use for the x-axis of the chart"
/>

# Metrics

## Options

<PropListing
    name="metric"  
    options='column name'
	description="Column to use for the x-axis of the chart"
/>
<PropListing
    name="label"  
    options='string'
	description="metric panel title"
/>
<PropListing
    name=fmt
    description="Format to use for x column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
