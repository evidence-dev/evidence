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
  <Column id=num_orders_num0 contentType=colorscale scaleColor=red />
  <Column id=aov_usd2 contentType=colorscale scaleColor=blue />
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
	<Column id=sales fmt=usd0k contentType=colorscale scaleColor={['#304a8a','#e8efff']}/> 
	<Column id=orders/> 
	<Column id=aov fmt=usd2 contentType=colorscale scaleColor={['#b52626','#FFFFFF','#2e9939']}/> 
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
		<Column id=sales fmt=usd0k contentType=colorscale scaleColor={['#304a8a','#e8efff']}/>
	{:else if inputs.display_column.value === 'orders'}
		<Column id=orders/>
	{:else}
		<Column id=aov fmt=usd2 contentType=colorscale scaleColor={['#b52626','#FFFFFF','#2e9939']}/>
	{/if}
</DataTable>
