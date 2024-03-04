# Table Accordion

```simple
select 'Canada' as country, 'A' as product, 200 as sales, 80 as margin, 0.058 as growth
union all
select 'Canada' as country, 'B' as product, 200 as sales, 120 as margin, 0.082 as growth
union all
select 'US' as country, 'A' as product, 1300 as sales, 802 as margin, -0.043 as growth
union all
select 'US' as country, 'B' as product, 2030 as sales, 1220 as margin, 0.066 as growth
```


<DataTable data={simple} totalRow=true summarizeGroups=true search=true groupsOpen=true groupBy=product rowNumbers=false > 
 	<Column id=country totalAgg="Total"/> 
	<Column id=product/> 
	<Column id=sales fmt=usd/> 
	<Column id=margin fmt=eur totalAgg=median weightCol=sales/> 
	<Column id=growth fmt=pct contentType=delta totalAgg=weightedMean weightCol=sales/>
 </DataTable>

 <DataTable data={simple} groupBy=product totalRow=true summarizeGroups=true rowNumbers=true/> 



```orders
select category, item, count(1) as orders, sum(sales) as sales from needful_things.orders
group by all
```

<DataTable data={orders} groupBy=category rows=3/>