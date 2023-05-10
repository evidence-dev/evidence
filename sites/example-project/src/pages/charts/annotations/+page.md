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
    <ReferenceLine y=90000 label="Target"/>
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
    <ReferenceArea x1='2020-03-14' x2='2020-08-15' label=First/>
    <ReferenceArea x1='2021-03-14' x2='2021-08-15' label=Second/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea y1=70000 y2=90000/>
</LineChart>

<LineChart 
    data={orders_by_month} 
    x=month
    y=num_orders_num0 
    yAxisTitle="Orders per Month"
>
    <ReferenceArea y1=2500 color=#d8f2d8 label="Good" labelPosition=right labelColor=var(--green-700)/>
    <ReferenceArea y1=1500 y2=2500 color=#fffcd4 label="Okay" labelPosition=right labelColor=var(--yellow-700)/>
    <ReferenceArea y1=0 y2=1500 color=#ffeceb label="Bad" labelPosition=right labelColor=var(--red-700)/>

</LineChart>


### From Database
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
>
    <ReferenceArea data={multiple_dates} x1=start_date x2=end_date label=name/>
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
