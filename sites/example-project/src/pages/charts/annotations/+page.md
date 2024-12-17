---
title: Annotations
queries:
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

let generated_multiple_dates = [{ start_date: '2019-12-05', end_date: '2019-12-31' }, { start_date: '2020-07-14', end_date: '2020-08-20' }, { start_date: '2021-04-14', end_date: '2021-05-03' }]

const date_range = 1638316800000 - 1546300800000;

const generate_date = (third) => {
	const start = 1546300800000 + (date_range / 3) * (third - 1);
	const end = start + date_range / 3;
	return new Date(start + Math.random() * (end - start));
};

const interval = setInterval(() => {
	generated_multiple_dates = [
		{
			start_date: generate_date(1),
			end_date: generate_date(1)
		},
		{
			start_date: generate_date(2),
			end_date: generate_date(2)
		},
		{
			start_date: generate_date(3),
			end_date: generate_date(3)
		}
	]
}, 1000);

onDestroy(() => {
	clearInterval(interval);
});
</script>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine data={generated_multiple_dates} x=start_date/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea data={generated_multiple_dates} xMin=start_date xMax=end_date color=base-content-muted/>
</LineChart>

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

### Diagonal

#### X2 and Y2

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
   <ReferenceLine 
    x=5000 
    y=0.01 
    x2=10000 
    y2=0.09 
    label="[x,y] to [x2,y2]"/>
</ScatterPlot>

#### Just X2

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
   <ReferenceLine 
    x=5000 
    y=0.01 
    x2=10000 
    label="Just x2"/>
</ScatterPlot>

#### Just Y2

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
   <ReferenceLine 
    x=5000 
    y=0.01  
    y2=0.09
    label="Just y2"/>
</ScatterPlot>

#### Error: Outside Bounds

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
   <ReferenceLine 
    x=5000 
    y=0.01 
    x2=27000 
    y2=0.09 
    label="Outside Bounds"/>
</ScatterPlot>

#### Error: Supplied X and Y but not X2 or Y2

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
   <ReferenceLine 
    x=5000 
    y=0.01 
    label="Error"/>
</ScatterPlot>

#### Error: supplied x2 and y2, x, y and data

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
    <ReferenceLine 
     x=continent
     y=continent
     x2=continent 
     y2=continent
     data={countries}
     label="Error"/>
</ScatterPlot>


#### Y = X Line

<ScatterPlot
    data={countries}
    x=jobless_rate_pct1
    xMin=0
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
   <ReferenceLine 
    x=0.0
    y=0.0
    x2=0.09
    y2=0.09 
    label="y=x"/>
</ScatterPlot>


#### Linear Regression

```sql orders_by_state
select 
    state,
    sum(sales) as sales_usd,
    count(*) as num_orders
from needful_things.orders
where state != 'Alaska'
group by all
order by sales_usd desc
```

```sql reg
WITH
means AS (
    SELECT 
        AVG(sales_usd) as mean_sales_usd,
        AVG(num_orders) as mean_num_orders
    FROM ${orders_by_state}
),
sums AS (
    SELECT 
        SUM((sales_usd - mean_sales_usd) * (num_orders - mean_num_orders)) as sum_xy,
        SUM((sales_usd - mean_sales_usd) * (sales_usd - mean_sales_usd)) as sum_xx
    FROM ${orders_by_state}, means
)
SELECT 
    sum_xy / sum_xx as slope,
    mean_num_orders - (sum_xy / sum_xx) * mean_sales_usd as intercept
FROM sums, means
```

<ScatterPlot
    data={orders_by_state}
    x=sales_usd
    y=num_orders
    xMin=0
    series=state
>
     <ReferenceLine
        x=0
        y={reg[0].slope * 0 + reg[0].intercept}
        x2=400000
        y2={reg[0].slope * 400000 + reg[0].intercept}
        label="Linear Regression"
        labelPosition=aboveCenter
    />
</ScatterPlot>

#### Arrow

<BarChart 
    data={countries}
    x=country
    y=gdp_usd
>
    <ReferenceLine 
        x='Japan'
        y=6500
        x2='Germany'
        y2=5000
        label="-23%"
        labelPosition=aboveCenter
        lineType=solid
        symbol=arrow
    />
</BarChart>

#### Trend

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine 
        x='2019-01-01' 
        y=80000 
        x2='2021-12-01' 
        y2=120000
        label="Trend"
    />
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
    <ReferenceLine y=110000 color=negative hideValue=true lineWidth=3 lineType=solid/>
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
    <ReferenceLine y=15000 color=negative label=negative/>
    <ReferenceLine y=35000 color=warning label=warning/>
    <ReferenceLine y=55000 color=positive label=positive/>
    <ReferenceLine y=75000 color=info label=info/>
    <ReferenceLine y=95000 color=base-content-muted label=base-content-muted/>
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
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label=First color=warning/>
    <ReferenceArea xMin='2021-03-14' xMax='2021-08-15' label=Second/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea yMin=70000 yMax=9000 color=negative/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=num_orders_num0 
    yAxisTitle="Orders per Month"
>
    <ReferenceArea yMin=2500 color=positive label="Good"/>
    <ReferenceArea yMin=1000 yMax=2500 color=warning label="Okay"/>
    <ReferenceArea yMin=0 yMax=1000 color=negative label="Bad" labelPosition=right/>
</LineChart>

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
	<ReferenceLine data={[{ gdp_growth_pct1: 0.101 }]} y=gdp_growth_pct1 />
    <ReferenceArea xMin=16000 xMax=24000 yMin=-0.03 yMax=0.055 label="Large and stagnant" color=base-content-muted border=true/>
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
    <ReferenceArea data={multiple_dates} xMin=start_date xMax=end_date color=base-content-muted/>
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
    <ReferenceArea xMax='2019-04-01' label=info color=info/>
    <ReferenceArea xMin='2019-04-01' xMax='2019-11-01' label=negative color=negative/>
    <ReferenceArea xMin='2019-11-01' xMax='2020-07-01' label=warning color=warning/>
    <ReferenceArea xMin='2020-07-01' xMax='2021-02-01' label=positive color=positive/>
    <ReferenceArea xMin='2021-02-01' xMax='2021-09-01' label=base-content-muted color=base-content-muted/>
    <ReferenceArea xMin='2021-09-01' label=custom color=#f2dbff labelColor=#4d1070/>
</LineChart>


## Example with Input

```sql target
select 90000 as target, 100000 as stretch, 2020 as year
union all
select 100000, 140000, 2021
```

<Dropdown data={target} name=year value=year defaultValue={2020}/>

```sql target_filtered
select * from ${target}
where year = ${inputs.year.value}
```

#### y-axis
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine data={target_filtered} y=target label="Target"/>
    <ReferenceArea data={target_filtered} yMin=target yMax=stretch />
</LineChart>

<DataTable data={generated_multiple_dates}>
    <Column id='start_date' fmt='iso'/>
    <Column id='end_date'/>
</DataTable>