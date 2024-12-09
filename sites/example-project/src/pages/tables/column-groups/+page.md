---
title: Column Groups
---

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


<DataTable data={countries} totalRow=true rows=5 wrapTitles groupBy=continent groupType=section totalRowColor=#f2f2f2>
  <Column id=continent totalAgg="Total" totalFmt='# "Unique continents"'/>
  <Column id=country totalAgg=countDistinct totalFmt='0 "countries"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"' colGroup="GDP"/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' colGroup="GDP" contentType=delta/>
  <Column id=jobless_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' contentType=colorscale colorScale=negative colGroup="Labour Market"/>
  <Column id=population totalAgg=sum fmt='#,##0"M"' totalFmt='#,##0.0,"B"' colGroup="Labour Market"/>
  <Column id=interest_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' wrapTitle=false colGroup="Other"/>
  <Column id=inflation_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' colGroup="Other"/>
  <Column id=gov_budget totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' contentType=delta colGroup="Other"/>
  <Column id=current_account totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' colGroup="Other"/>
</DataTable>