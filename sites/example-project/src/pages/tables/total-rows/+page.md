---
title: Total Rows
queries:
  - orders_by_category: orders_by_category.sql
  - orders_with_comparisons: orders_with_comparisons.sql
---


## No Aggregation Specified

<DataTable data={orders_by_category} totalRow=true rowNumbers=true rows=5 search/>


<DataTable data={orders_with_comparisons} totalRow=true rowNumbers=true rows=5 search/>

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
  <Column id=num_orders_num0 contentType=colorscale scaleColor=negative totalAgg=sum totalFmt='num0k'/>
  <Column id=aov_usd2 contentType=colorscale scaleColor=info totalAgg="{orders_all[0].aov_usd2}" totalFmt="usd2"/>
</DataTable>

### Count

<DataTable data={orders_with_comparisons} totalRow=true wrapTitles>
  <Column id=month totalAgg=count />
  <Column id=category totalAgg=count />
  <Column id=sales_usd0k totalAgg=count />
  <Column id=num_orders_num0 scaleColor=negative totalAgg=count />
  <Column id=aov_usd2 scaleColor=info totalAgg=count />
  <Column id=prev_sales_usd0k totalAgg=count />
  <Column id=prev_num_orders_num0 scaleColor=negative totalAgg=count />  
  <Column id=prev_aov_usd2 scaleColor=info totalAgg=count />
  <Column id=sales_change_pct0 scaleColor=positive totalAgg=count />
  <Column id=num_orders_change_pct0 scaleColor=positive totalAgg=count />
  <Column id=aov_change_pct0 scaleColor=positive totalAgg=count />
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

### Weighted Mean
Weighted mean requires passsing a `weightCol`.

If no `weightCol` is specified, the result will be identical to the result from `totalAgg=mean`

<DataTable data={orders_with_comparisons} totalRow=true>
  <Column id=month totalAgg="Weighted Mean"/>
  <Column id=category totalAgg=""/>
  <Column id=sales_usd0k totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=num_orders_num0 totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=aov_usd2 totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=prev_sales_usd0k totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=prev_num_orders_num0 totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=prev_aov_usd2 totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=sales_change_pct0 totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=num_orders_change_pct0 totalAgg=weightedMean weightCol=sales_usd0k/>
  <Column id=aov_change_pct0 totalAgg=weightedMean weightCol=sales_usd0k/>
</DataTable>


## Formats from Column

```sql no_tags
select 
    month,
    category,
    sales_usd0k as sales,
    num_orders_num0 as num_orders,
    aov_usd2 as aov
from ${orders_with_comparisons}
```

```country_example
select * from ${countries}
limit 5
```

<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd totalAgg=sum/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct2'/>
  <Column id=population totalAgg=mean fmt='#,##0"M"'/>
</DataTable>

<DataTable data={no_tags} totalRow=true rowNumbers=true>
  <Column id=month totalAgg=countDistinct />
  <Column id=category totalAgg=countDistinct/>
  <Column id=sales totalAgg=sum fmt='usd0'/>
  <Column id=num_orders totalAgg=sum/>
  <Column id=aov totalAgg=sum fmt='usd1'/>
</DataTable>

## Formats from fmt are overridden by totalFmt


<DataTable data={no_tags} totalRow=true>
    <Column id=month totalAgg=countDistinct />
    <Column id=category totalAgg=countDistinct/>
    <Column id=sales totalAgg=sum fmt=usd0 totalFmt='#'/>
    <Column id=num_orders totalAgg=sum fmt='#.0' totalFmt='num0k'/>
    <Column id=aov totalAgg=sum fmt='usd1' totalFmt='usd2'/>
</DataTable>

## Docs

```sql countries
SELECT 'United States' as country, 'North America' as continent, 22996 as gdp_usd, 0.017 as gdp_growth, 0.025 as interest_rate, 0.085 as inflation_rate, 0.037 as jobless_rate, -16.7 as gov_budget, 137.2 as debt_to_gdp, -3.6 as current_account, 332.4 as population
UNION ALL
SELECT 'China', 'Asia', 17734, 0.004, 0.0365, 0.027, 0.054, -3.7, 66.8, 1.8, 1412.6
UNION ALL
SELECT 'Japan', 'Asia', 4937, 0.002, -0.001, 0.026, 0.026, -12.6, 266.2, 3.2, 125.31
UNION ALL
SELECT 'Germany', 'Europe', 4223, 0.017, 0.005, 0.079, 0.055, -3.7, 69.3, 7.4, 83.16
UNION ALL
SELECT 'United Kingdom', 'Europe', 3187, 0.029, 0.0175, 0.101, 0.038, -6, 95.9, -2.6, 67.53
UNION ALL
SELECT 'India', 'Asia', 3173, 0.135, 0.054, 0.0671, 0.078, -9.4, 73.95, -1.7, 1380
UNION ALL
SELECT 'France', 'Europe', 2937, 0.042, 0.005, 0.058, 0.074, -6.5, 112.9, 0.4, 67.63
UNION ALL
SELECT 'Italy', 'Europe', 2100, 0.047, 0.005, 0.084, 0.079, -7.2, 150.8, 2.5, 59.24
UNION ALL
SELECT 'Canada', 'North America', 1991, 0.029, 0.025, 0.076, 0.049, -4.7, 117.8, 0.1, 38.44
UNION ALL
SELECT 'South Korea', 'Asia', 1799, 0.029, 0.025, 0.057, 0.029, -6.1, 42.6, 3.5, 51.74
UNION ALL
SELECT 'Russia', 'Europe', 1776, -0.04, 0.08, 0.151, 0.039, 0.8, 18.2, 6.8, 145.55
UNION ALL
SELECT 'Brazil', 'South America', 1609, 0.032, 0.1375, 0.1007, 0.091, -4.5, 80.27, -1.8, 213.32
```

### Default Total Row (Sum)

<DataTable data={countries} totalRow=true rows=5 wrapTitles=true />

### Default Aggregation Functions

<DataTable data={countries} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd totalAgg=sum/>
  <Column id=gdp_growth totalAgg=mean fmt='pct2'/>
  <Column id=population totalAgg=sum fmt='#,##0"M"'/>
</DataTable>

### Custom Aggregations Values

<DataTable data={countries} totalRow=true rows=5>
  <Column id=country totalAgg="Just the USA"/>
  <Column id=gdp_usd totalAgg={countries[0].gdp_usd} totalFmt=usd/>
</DataTable>

### Custom Total Formats

<DataTable data={countries} totalRow=true rows=5 wrapTitles>
  <Column id=country totalAgg="All Countries"/>
  <Column id=continent totalAgg=countDistinct totalFmt='# "Unique continents"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"'/>
  <Column id=gdp_growth totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=interest_rate totalAgg=mean fmt='pct2' totalFmt='pct1' wrapTitle=false/>
  <Column id=inflation_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=jobless_rate totalAgg=mean fmt='pct0'/>
  <Column id=gov_budget totalAgg=mean fmt='0.0"%"'/>
  <Column id=debt_to_gdp totalAgg=mean fmt='0"%"'/>
  <Column id=current_account totalAgg=mean fmt='0.0"%"'/>
  <Column id=population totalAgg=sum fmt='#,##0"M"'/>
</DataTable>