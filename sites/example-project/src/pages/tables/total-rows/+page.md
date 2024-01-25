---
title: Data Table
queries:
  - orders_by_category: orders_by_category.sql
  - orders_with_comparisons: orders_with_comparisons.sql
---

# Total Rows

## No Aggregation Specified

<DataTable data={orders_by_category} totalRow=true rowNumbers=true rows=5/>


<DataTable data={orders_with_comparisons} totalRow=true rowNumbers=true rows=5/>

## Aggregation Specified

```sql orders_all
select 
  sum(sales_usd0k), 
  sum(num_orders_num0),
  sum(sales_usd0k) / sum(num_orders_num0) as aov_usd2
from ${orders_by_category}
```


<DataTable data={orders_by_category} totalRow=true rowNumbers=true rows=5>
  <Column id=month totalAgg="All Months"/>
  <Column id=category totalAgg=countDistinct totalFmt='# "Unique Categories"'/>
  <Column id=sales_usd0k contentType=colorscale totalAgg=sum totalFmt='$000.0,,"M"'/>
  <Column id=num_orders_num0 contentType=colorscale scaleColor=red totalAgg=sum totalFmt='num0k'/>
  <Column id=aov_usd2 contentType=colorscale scaleColor=blue totalAgg="{orders_all[0].aov_usd2}" totalFmt="usd2"/>
</DataTable>

### Count

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=count/>
  <Column id=category totalAgg=count/>
  <Column id=sales_usd0k totalAgg=count/>
  <Column id=num_orders_num0 scaleColor=red totalAgg=count/>
  <Column id=aov_usd2 scaleColor=blue totalAgg=count/>
  <Column id=prev_sales_usd0k totalAgg=count/>
  <Column id=prev_num_orders_num0 scaleColor=red totalAgg=count/>  
  <Column id=prev_aov_usd2 scaleColor=blue totalAgg=count/>
  <Column id=sales_change_pct0 scaleColor=green totalAgg=count/>
  <Column id=num_orders_change_pct0 scaleColor=green totalAgg=count/>
  <Column id=aov_change_pct0 scaleColor=green totalAgg=count/>
</DataTable>

### Count Distinct

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=countDistinct/>
  <Column id=category totalAgg=countDistinct/>
  <Column id=sales_usd0k totalAgg=countDistinct/>
  <Column id=num_orders_num0 totalAgg=countDistinct/>
  <Column id=aov_usd2 totalAgg=countDistinct/>
  <Column id=prev_sales_usd0k totalAgg=countDistinct/>
  <Column id=prev_num_orders_num0 totalAgg=countDistinct/>
  <Column id=prev_aov_usd2 totalAgg=countDistinct/>
  <Column id=sales_change_pct0 totalAgg=countDistinct/>
  <Column id=num_orders_change_pct0 totalAgg=countDistinct/>
  <Column id=aov_change_pct0 totalAgg=countDistinct/>
</DataTable>

### Custom String

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg="All Months"/>
  <Column id=category totalAgg="All Categories"/>
  <Column id=sales_usd0k totalAgg="All Sales"/>
  <Column id=num_orders_num0 totalAgg="All Orders"/>
  <Column id=aov_usd2 totalAgg="All AOV"/>
  <Column id=prev_sales_usd0k totalAgg="All Previous Sales"/>
  <Column id=prev_num_orders_num0 totalAgg="All Previous Orders"/>
  <Column id=prev_aov_usd2 totalAgg="All Previous AOV"/>
  <Column id=sales_change_pct0 totalAgg="All Sales Change"/>
  <Column id=num_orders_change_pct0 totalAgg="All Orders Change"/>
  <Column id=aov_change_pct0 totalAgg="All AOV Change"/>
</DataTable>

### Custom Value Raw

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg="{orders_with_comparisons[0].month}"/>
  <Column id=category totalAgg="{orders_with_comparisons[0].category}"/>
  <Column id=sales_usd0k totalAgg="{orders_with_comparisons[0].sales_usd0k}"/>
  <Column id=num_orders_num0 totalAgg="{orders_with_comparisons[0].num_orders_num0}"/>
  <Column id=aov_usd2 totalAgg="{orders_with_comparisons[0].aov_usd2}"/>
  <Column id=prev_sales_usd0k totalAgg="{orders_with_comparisons[0].prev_sales_usd0k}"/>
  <Column id=prev_num_orders_num0 totalAgg="{orders_with_comparisons[0].prev_num_orders_num0}"/>
  <Column id=prev_aov_usd2 totalAgg="{orders_with_comparisons[0].prev_aov_usd2}"/>
  <Column id=sales_change_pct0 totalAgg="{orders_with_comparisons[0].sales_change_pct0}"/>
  <Column id=num_orders_change_pct0 totalAgg="{orders_with_comparisons[0].num_orders_change_pct0}"/>
  <Column id=aov_change_pct0 totalAgg="{orders_with_comparisons[0].aov_change_pct0}"/>
</DataTable>

### Custom Value Formatted

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg={orders_with_comparisons[0].month} totalFmt="yyyy-mm-dd"/>
  <Column id=category totalAgg={orders_with_comparisons[0].category} />
  <Column id=sales_usd0k totalAgg={orders_with_comparisons[0].sales_usd0k} totalFmt='usd0k'/>
  <Column id=num_orders_num0 totalAgg={orders_with_comparisons[0].num_orders_num0}/>
  <Column id=aov_usd2 totalAgg={orders_with_comparisons[0].aov_usd2} totalFmt='usd2'/>
  <Column id=prev_sales_usd0k totalAgg={orders_with_comparisons[0].prev_sales_usd0k} totalFmt='usd0k'/>
  <Column id=prev_num_orders_num0 totalAgg={orders_with_comparisons[0].prev_num_orders_num0}/>
  <Column id=prev_aov_usd2 totalAgg={orders_with_comparisons[0].prev_aov_usd2} totalFmt='usd2'/>
  <Column id=sales_change_pct0 totalAgg={orders_with_comparisons[0].sales_change_pct0} totalFmt='pct0'/>
  <Column id=num_orders_change_pct0 totalAgg={orders_with_comparisons[0].num_orders_change_pct0} totalFmt='pct0'/>
  <Column id=aov_change_pct0 totalAgg={orders_with_comparisons[0].aov_change_pct0} totalFmt='pct0'/>
</DataTable>

### Min

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=min/>
  <Column id=category totalAgg=min/>
  <Column id=sales_usd0k totalAgg=min/>
  <Column id=num_orders_num0 totalAgg=min/>
  <Column id=aov_usd2 totalAgg=min/>
  <Column id=prev_sales_usd0k totalAgg=min/>
  <Column id=prev_num_orders_num0 totalAgg=min/>
  <Column id=prev_aov_usd2 totalAgg=min/>
  <Column id=sales_change_pct0 totalAgg=min/>
  <Column id=num_orders_change_pct0 totalAgg=min/>
  <Column id=aov_change_pct0 totalAgg=min/>
</DataTable>

### Max

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=max/>
  <Column id=category totalAgg=max/>
  <Column id=sales_usd0k totalAgg=max/>
  <Column id=num_orders_num0 totalAgg=max/>
  <Column id=aov_usd2 totalAgg=max/>
  <Column id=prev_sales_usd0k totalAgg=max/>
  <Column id=prev_num_orders_num0 totalAgg=max/>
  <Column id=prev_aov_usd2 totalAgg=max/>
  <Column id=sales_change_pct0 totalAgg=max/>
  <Column id=num_orders_change_pct0 totalAgg=max/>
  <Column id=aov_change_pct0 totalAgg=max/>
</DataTable>

### Sum

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=sum/>
  <Column id=category totalAgg=sum/>
  <Column id=sales_usd0k totalAgg=sum/>
  <Column id=num_orders_num0 totalAgg=sum/>
  <Column id=aov_usd2 totalAgg=sum/>
  <Column id=prev_sales_usd0k totalAgg=sum/>
  <Column id=prev_num_orders_num0 totalAgg=sum/>
  <Column id=prev_aov_usd2 totalAgg=sum/>
  <Column id=sales_change_pct0 totalAgg=sum/>
  <Column id=num_orders_change_pct0 totalAgg=sum/>
  <Column id=aov_change_pct0 totalAgg=sum/>
</DataTable>

### Mean

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=mean/>
  <Column id=category totalAgg=mean/>
  <Column id=sales_usd0k totalAgg=mean/>
  <Column id=num_orders_num0 totalAgg=mean/>
  <Column id=aov_usd2 totalAgg=mean/>
  <Column id=prev_sales_usd0k totalAgg=mean/>
  <Column id=prev_num_orders_num0 totalAgg=mean/>
  <Column id=prev_aov_usd2 totalAgg=mean/>
  <Column id=sales_change_pct0 totalAgg=mean/>
  <Column id=num_orders_change_pct0 totalAgg=mean/>
  <Column id=aov_change_pct0 totalAgg=mean/>
</DataTable>

### Median

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg=median/>
  <Column id=category totalAgg=median/>
  <Column id=sales_usd0k totalAgg=median/>
  <Column id=num_orders_num0 totalAgg=median/>
  <Column id=aov_usd2 totalAgg=median/>
  <Column id=prev_sales_usd0k totalAgg=median/>
  <Column id=prev_num_orders_num0 totalAgg=median/>
  <Column id=prev_aov_usd2 totalAgg=median/>
  <Column id=sales_change_pct0 totalAgg=median/>
  <Column id=num_orders_change_pct0 totalAgg=median/>
  <Column id=aov_change_pct0 totalAgg=median/>
</DataTable>