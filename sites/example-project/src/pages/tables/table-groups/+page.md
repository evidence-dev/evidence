# Table Groups

```orders
select state, category, item, count(1) as orders, sum(sales) as sales, if(random() > 0.3, 1, -1) * 0.1 * random() as growth from needful_things.orders
group by all
limit 25
```

## Accordion
`groupType=accordion`

### With Subtotals
<DataTable data={orders} groupBy=state subtotals=true> 
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
 </DataTable>

### Without Subtotals
<DataTable data={orders} groupBy=state>
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
 </DataTable>

### With Totals
<DataTable data={orders} groupBy=state subtotals=true totalRow=true/>

### Groups Closed by Default
<DataTable data={orders} groupBy=state subtotals=true totalRow=true groupsOpen=false> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=countDistinct totalFmt='[=1]0 "category";0 "categories"'/> 
	<Column id=item  totalAgg=countDistinct totalFmt='[=1]0 "item";0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
 </DataTable>

### With Configured Columns
<DataTable data={orders} groupBy=category subtotals=true totalRow=true> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
 </DataTable>

## Section
`groupType=section`

### With Subtotals
<DataTable data={orders} groupBy=state subtotals=true groupType=section>
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>

### Without Subtotals
<DataTable data={orders} groupBy=state subtotals=false groupType=section/>

### With Totals
<DataTable data={orders} groupBy=state subtotals=true groupType=section totalRow=true/>

### With Configured Columns
<DataTable data={orders} groupBy=category groupType=section subtotals=true totalRow=true totalRowColor=#fff0cc> 
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>