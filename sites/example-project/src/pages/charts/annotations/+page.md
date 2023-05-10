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
select '2019-12-05' as start_date, '2019-12-31' as end_date, 'Campaign A' as name
union all
select '2020-07-14' as start_date, '2020-08-20' as end_date, 'Campaign B' as name
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
    <ReferenceLine y=90000 label="Target" />
</LineChart>

#### x-axis
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceLine x='2019-09-18' label="Launch" showValueInLabel=false/>
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

## Reference Area

### Hardcoded
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea x1='2020-03-14' x2='2020-08-15' label=First color=yellow/>
    <ReferenceArea x1='2021-03-14' x2='2021-08-15' label=Second/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea y1=70000 y2=9000 color=red/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=num_orders_num0 
    yAxisTitle="Orders per Month"
>
    <ReferenceArea y1=2500 color=green label="Good" labelPosition=right border=true/>
    <ReferenceArea y1=1500 y2=2500 color=yellow label="Okay" labelPosition=right/>
    <ReferenceArea y1=0 y2=1500 color=red label="Bad" labelPosition=right/>
</LineChart>

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
>
    <ReferenceArea x1=16000 x2=24000 y1=-0.03 y2=0.055 label="Large and stagnant" color=grey border=true/>
</ScatterPlot>


### From Database
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea data={multiple_dates} x1=start_date x2=end_date label=name color=grey/>
</LineChart>

## BigQuery Examples

```daily_complaints
    select
        extract(date from created_date) as date,
        count(*) as number_of_complaints
    from `bigquery-public-data.austin_311.311_service_requests`
    group by 1
    order by 1 desc
    limit 150
```

```annotate
select '2020-12-05' as start_date, '2022-12-31' as end_date, 'Campaign A' as label
union all
select '2023-02-14' as start_date, '2023-03-20' as end_date, 'Campaign B' as label
union all
select '2023-04-14' as start_date, null as end_date, 'Campaign C' as label
```

<LineChart
data={daily_complaints}
x=date
y=number_of_complaints
title="Complaint Calls to Austin 311"
>

    <ReferenceArea data={annotate} x1=start_date x2=end_date y1=2000 label=label/>

</LineChart>

<LineChart
data={daily_complaints}
x=date
y=number_of_complaints
title="Complaint Calls to Austin 311"
>

    <ReferenceLine y=600 showValueInLabel=true label="Target"/>

</LineChart>

<LineChart
data={daily_complaints}
x=date
y=number_of_complaints
title="Complaint Calls to Austin 311"
>
    <ReferenceArea y1=0 y2=1000 color=#d8f2d8 labelColor=#79b379 label=Normal labelPosition=bottomRight/>
    <ReferenceArea y1=1000 y2=2000 color=#fffcd4 label=Elevated labelColor=#e0bd48 labelPosition=right/>
    <ReferenceArea y1=2000 color=#ffeceb labelColor=#cf625b label=Emergency labelPosition=topRight/>
    <ReferenceLine x='2023-01-30' label="Garbage Strike" showValueInLabel=false/>
</LineChart>