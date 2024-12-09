---
title: Data Table
queries:
  - orders_by_category: orders_by_category.sql
  - orders_with_comparisons: orders_with_comparisons.sql
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet enim rutrum, rutrum metus in, vulputate quam. Duis posuere enim feugiat urna fringilla blandit vehicula ac dui. Nunc consequat enim vel purus vestibulum rhoncus. Nunc porta luctus odio, ac luctus urna tincidunt cursus.
<DataTable data={orders_by_category}/>

<DataTable data={orders_by_category} compact/>

Nulla facilisi. Aliquam vulputate mollis aliquam. Duis dignissim elementum dictum. Curabitur ornare lorem velit, eget tempus ex suscipit eu. Sed nec nisl a lorem vulputate interdum. Pellentesque viverra vitae est sed porttitor. Etiam interdum in enim a pellentesque.

<DataTable data={orders_with_comparisons} rowNumbers=true search=true rowLines=true/>

Aliquam massa elit, egestas eget risus nec, rhoncus vehicula ante. Cras placerat vitae ante eu hendrerit. Ut eget nunc nec ligula rutrum euismod. Vivamus at viverra elit. Nam id velit leo. Cras nisl velit, lacinia eget elementum vitae, tristique id purus. Vestibulum imperdiet congue mollis. Ut neque sapien, malesuada ut ultrices at, hendrerit at lorem. Aenean ornare suscipit pellentesque. Etiam facilisis nibh in diam suscipit, ut tincidunt est ultrices.

## Rows Property

### rows=40

<DataTable data={orders_by_category} rows=40 rowNumbers=true>
  <Column id=month />
  <Column id=category />
  <Column id=sales_usd0k contentType=colorscale />
  <Column id=num_orders_num0 contentType=colorscale colorScale=negative />
  <Column id=aov_usd2 contentType=colorscale colorScale=info />
</DataTable>


{fmt(1003530000, '[>=1000000000]$#,##0.0,,,"B";$#,##0.0,,"M"')}

## Fuzzy Search

<DataTable data={[{ thing: 'The world has many goodbyes and hellos.' }]} search=true />

```summary
select category, sum(sales_usd0k) as sales, sum(num_orders_num0) as orders, sales/orders as aov
from ${orders_by_category}
group by all
```

<DataTable data={summary}> 
 	<Column id=category/> 
	<Column id=sales fmt=usd0k contentType=colorscale colorScale={['#304a8a','#e8efff']}/> 
	<Column id=orders/> 
	<Column id=aov fmt=usd2 contentType=colorscale colorScale={['#b52626','#FFFFFF','#2e9939']}/> 
 </DataTable>

## Conditional Columns

<Dropdown name="display_column">
	<DropdownOption value="sales">Sales</DropdownOption>
	<DropdownOption value="orders">Orders</DropdownOption>
	<DropdownOption value="aov">AOV</DropdownOption>
</Dropdown>

<DataTable data={summary}>
	<Column id="category" />
	{#if inputs.display_column.value === 'sales'}
		<Column id=sales fmt=usd0k contentType=colorscale colorScale={['#304a8a','#e8efff']}/>
	{:else if inputs.display_column.value === 'orders'}
		<Column id=orders/>
	{:else}
		<Column id=aov fmt=usd2 contentType=colorscale colorScale={['#b52626','#FFFFFF','#2e9939']}/>
	{/if}
</DataTable>

## Sparkline

 ```sql cats
WITH monthly_sales AS (
    SELECT 
        category,
        DATE_TRUNC('month', order_datetime) AS date,
        SUM(sales) AS monthly_sales
    FROM 
        needful_things.orders
    GROUP BY 
        category, DATE_TRUNC('month', order_datetime)
)
SELECT 
    category,
    sum(monthly_sales) as total_sales,
    ARRAY_AGG({'date': date, 'sales': monthly_sales}) AS sales
FROM 
    monthly_sales
GROUP BY 
    category
order by total_sales desc
```

<DataTable data={cats}>
    <Column id=category/>
    <Column id=total_sales fmt=usd contentType=bar align=left/>
    <Column id=sales contentType=sparkarea sparkX=date sparkY=sales sparkYScale=false sparkColor=red/>
    <Column id=sales contentType=sparkbar sparkX=date sparkY=sales sparkYScale=false />
    <Column id=sales contentType=sparkline sparkX=date sparkY=sales sparkYScale=false />
    <Column id=sales contentType=sparkbar sparkX=date sparkY=sales sparkYScale=false />
</DataTable>

## Bar Viz

<DataTable data={summary}>
  <Column id=category/>
  <Column id=sales contentType=bar fmt=usd align=left/>
  <Column id=orders/>
  <Column id=aov contentType=colorscale fmt=usd/>
</DataTable>

