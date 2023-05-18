# Dates and Times

## Query Viewer

```sql date_query
select date('2020-04-25') as date, 100 as value
union all
select date('2020-04-26') as date, 103 as value
union all
select date('2020-04-27') as date, 106 as value
union all
select date('2020-04-28') as date, 109 as value
union all
select date('2020-04-29') as date, 115 as value
union all
select date('2020-04-30') as date, 125 as value
limit 100
```

## Value Component

<Value data={date_query}/>

## DataTable Component

<DataTable data={date_query}/>

## Chart

<LineChart
    data={date_query}
    x=date
    y=value
/>
