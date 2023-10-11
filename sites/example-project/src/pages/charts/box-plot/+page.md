# Box Plot

```sql box
select 100 as value
union all
select 535 as value
union all
select 135 as value
union all
select 33 as value
union all
select 7 as value
union all
select 35 as value
union all
select 85 as value
union all
select 46 as value
union all
select 78 as value
union all
select 353 as value
union all
select 646 as value
union all
select 345 as value
```

<BoxPlot data={box} xType=category y=value options={{
    xAxis: {
        
    }
}}/>

<BoxPlot data={box} y=value/>