---
title: Annotations
sources:
  - orders_by_category: orders_by_category.sql
  - orders_by_category_2021: orders_by_category_2021.sql
  - orders_by_item: orders_by_item.sql
  - items_all_time: orders_by_item_all_time.sql
  - marketing_spend: marketing_spend.sql
  - orders_by_month: orders_by_month.sql
---

<script>

let countries = [
    {country: 'United States', continent: 'North America', gdp_usd: 22996, gdp_growth_pct1: 0.017, interest_rate_pct1: 0.025, inflation_rate_pct1: 0.085, jobless_rate_pct1: 0.037, gov_budget: -16.7, debt_to_gdp: 137.2, current_account: -3.6, population: 332.4},
    {country: 'China', continent: 'Asia', gdp_usd: 17734, gdp_growth_pct1: 0.004, interest_rate_pct1: 0.0365, inflation_rate_pct1: 0.027, jobless_rate_pct1: 0.054, gov_budget: -3.7, debt_to_gdp: 66.8, current_account: 1.8, population: 1412.6},
    {country: 'Japan', continent: 'Asia', gdp_usd: 4937, gdp_growth_pct1: 0.002, interest_rate_pct1: -0.001, inflation_rate_pct1: 0.026, jobless_rate_pct1: 0.026, gov_budget: -12.6, debt_to_gdp: 266.2, current_account: 3.2, population: 125.31},
    {country: 'Germany', continent: 'Europe', gdp_usd: 4223, gdp_growth_pct1: 0.017, interest_rate_pct1: 0.005, inflation_rate_pct1: 0.079, jobless_rate_pct1: 0.055, gov_budget: -3.7, debt_to_gdp: 69.3, current_account: 7.4, population: 83.16},
    {country: 'United Kingdom', continent: 'Europe', gdp_usd: 3187, gdp_growth_pct1: 0.029, interest_rate_pct1: 0.0175, inflation_rate_pct1: 0.101, jobless_rate_pct1: 0.038, gov_budget: -6, debt_to_gdp: 95.9, current_account: -2.6, population: 67.53},
    {country: 'India', continent: 'Asia', gdp_usd: 3173, gdp_growth_pct1: 0.135, interest_rate_pct1: 0.054, inflation_rate_pct1: 0.0671, jobless_rate_pct1: 0.078, gov_budget: -9.4, debt_to_gdp: 73.95, current_account: -1.7, population: 1380},
    {country: 'France', continent: 'Europe', gdp_usd: 2937, gdp_growth_pct1: 0.042, interest_rate_pct1: 0.005, inflation_rate_pct1: 0.058, jobless_rate_pct1: 0.074, gov_budget: -6.5, debt_to_gdp: 112.9, current_account: 0.4, population: 67.63},
    {country: 'Italy', continent: 'Europe', gdp_usd: 2100, gdp_growth_pct1: 0.047, interest_rate_pct1: 0.005, inflation_rate_pct1: 0.084, jobless_rate_pct1: 0.079, gov_budget: -7.2, debt_to_gdp: 150.8, current_account: 2.5, population: 59.24},
    {country: 'Canada', continent: 'North America', gdp_usd: 1991, gdp_growth_pct1: 0.029, interest_rate_pct1: 0.025, inflation_rate_pct1: 0.076, jobless_rate_pct1: 0.049, gov_budget: -4.7, debt_to_gdp: 117.8, current_account: 0.1, population: 38.44},
    {country: 'South Korea', continent: 'Asia', gdp_usd: 1799, gdp_growth_pct1: 0.029, interest_rate_pct1: 0.025, inflation_rate_pct1: 0.057, jobless_rate_pct1: 0.029, gov_budget: -6.1, debt_to_gdp: 42.6, current_account: 3.5, population: 51.74},
    {country: 'Russia', continent: 'Europe', gdp_usd: 1776, gdp_growth_pct1: -0.04, interest_rate_pct1: 0.08, inflation_rate_pct1: 0.151, jobless_rate_pct1: 0.039, gov_budget: 0.8, debt_to_gdp: 18.2, current_account: 6.8, population: 145.55},
    {country: 'Brazil', continent: 'South America', gdp_usd: 1609, gdp_growth_pct1: 0.032, interest_rate_pct1: 0.1375, inflation_rate_pct1: 0.1007, jobless_rate_pct1: 0.091, gov_budget: -4.5, debt_to_gdp: 80.27, current_account: -1.8, population: 213.32}
]
</script>

```multiple_dates
select '2019-12-05' as start_date, '2019-12-31' as end_date
union all
select '2020-07-14' as start_date, '2020-08-20' as end_date
union all
select '2021-04-14' as start_date, '2021-05-03' as end_date
```

```campaigns
select '2019-07-05' as start_date, '2019-11-30' as end_date, 'Campaign A' as name
union all
select '2020-07-14' as start_date, '2020-12-20' as end_date, 'Campaign B' as name
union all
select '2021-04-14' as start_date, null as end_date, 'Campaign C' as name
```

## Reference Line

### Hardcoded

#### y-axis
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine y=90000 label="Target"/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine y=90000 label="Target" labelPosition=belowEnd/>
    <ReferenceLine y=105000 label="Forecast"/>
</LineChart>


#### x-axis
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine x='2019-09-18' label="Launch" hideValue=true/>
</LineChart>

### From Database
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine data={multiple_dates} x=start_date/>
</LineChart>

### Custom Styling
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine y=110000 color=red hideValue=true lineWidth=3 lineType=solid/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine y=40000 label=aboveStart labelPosition=aboveStart hideValue=true/>
    <ReferenceLine y=40000 label=aboveCenter labelPosition=aboveCenter hideValue=true/>
    <ReferenceLine y=40000 label=aboveEnd labelPosition=aboveEnd hideValue=true/>
    <ReferenceLine y=40000 label=belowStart labelPosition=belowStart hideValue=true/>
    <ReferenceLine y=40000 label=belowCenter labelPosition=belowCenter hideValue=true/>
    <ReferenceLine y=40000 label=belowEnd labelPosition=belowEnd hideValue=true/>
</LineChart>


<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine y=15000 color=red label=red/>
    <ReferenceLine y=35000 color=yellow label=yellow/>
    <ReferenceLine y=55000 color=green label=green/>
    <ReferenceLine y=75000 color=blue label=blue/>
    <ReferenceLine y=95000 color=grey label=grey/>
    <ReferenceLine y=115000 color=#63178f label=custom/>
</LineChart>

## Reference Area

### Hardcoded
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label=First color=yellow/>
    <ReferenceArea xMin='2021-03-14' xMax='2021-08-15' label=Second/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea yMin=70000 yMax=9000 color=red/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=num_orders_num0 
    yAxisTitle="Orders per Month"
>
    <ReferenceArea yMin=2500 color=green label="Good"/>
    <ReferenceArea yMin=1000 yMax=2500 color=yellow label="Okay"/>
    <ReferenceArea yMin=0 yMax=1000 color=red label="Bad" labelPosition=right/>
</LineChart>

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
    <ReferenceArea xMin=16000 xMax=24000 yMin=-0.03 yMax=0.055 label="Large and stagnant" color=grey border=true/>
</ScatterPlot>

<BarChart 
    data={orders_by_category_2021} 
    x=month 
    y=sales_usd0k 
    series=category
>
    <ReferenceArea xMin='2021-01-01' xMax='2021-04-01'/>
</BarChart> 

### From Database
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea data={multiple_dates} xMin=start_date xMax=end_date color=grey/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea data={campaigns} xMin=start_date xMax=end_date label=name/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topLeft labelPosition=topLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=top labelPosition=top/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topRight labelPosition=topRight/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=left labelPosition=left/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=center labelPosition=center/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=right labelPosition=right/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomLeft labelPosition=bottomLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottom labelPosition=bottom/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomRight labelPosition=bottomRight/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
>
    <ReferenceArea xMax='2019-04-01' label=blue color=blue/>
    <ReferenceArea xMin='2019-04-01' xMax='2019-11-01' label=red color=red/>
    <ReferenceArea xMin='2019-11-01' xMax='2020-07-01' label=yellow color=yellow/>
    <ReferenceArea xMin='2020-07-01' xMax='2021-02-01' label=green color=green/>
    <ReferenceArea xMin='2021-02-01' xMax='2021-09-01' label=grey color=grey/>
    <ReferenceArea xMin='2021-09-01' label=custom color=#f2dbff labelColor=#4d1070/>
</LineChart>
