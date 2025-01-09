# Date Ranges

## Manual min/max dates

<DateRange start="2022-01-02" end="2023-05-07" />


````markdown
<DateRange start="2022-01-02" end="2023-05-07" />
````


## Universal SQL min/max dates

```orders
select * from orders limit 1000
```


<DateRange data={orders} dates="order_datetime" name="order_range" />


````markdown
<DateRange data={orders} dates="order_datetime" name="order_range" />
````


```range_of_orders
select * from orders where order_datetime between '${inputs.order_range.start}' and '${inputs.order_range.end}'
limit 1000
```

<DataTable data={range_of_orders} />

## With string table

<DateRange data="orders" dates="order_datetime" name="order_range_2" />

```range_of_orders_2
select * from orders where order_datetime between '${inputs.order_range_2.start}' and '${inputs.order_range_2.end}'
limit 1000
```

<DataTable data={range_of_orders_2} />

## With defaultValue

<DateRange
    name=date_picker
    start='2021-01-01'
    end='2021-10-21'
    defaultValue='Last 7 Days'
/>

```sql dates
select 
'${inputs.date_picker.start}' as start, 
'${inputs.date_picker.end}' as end
```

<DataTable data={dates}/>

```sql orders_per_day
select 
date_trunc('day', order_datetime) as date,
count(*) as orders
from orders
where order_datetime between '${inputs.date_picker.start}' and '${inputs.date_picker.end}'
group by 1
```

<LineChart
    data={orders_per_day}
    x=date
    y=orders
/>
