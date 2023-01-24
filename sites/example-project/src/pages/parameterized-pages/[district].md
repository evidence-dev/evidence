
```federal_reserve_districts
    select 
        fed_reserve_district as name, 
        count(distinct institution_name) as distinct_institutions,
        from `bigquery-public-data.fdic_banks.institutions`
    group by 1
```

# Details for <Value data={federal_reserve_districts.filter(d => d.name === $page.params.district)} column=name/>

<DataTable data={federal_reserve_districts.filter(d => d.name == $page.params.district)} />

## Bar Chart
<BarChart
    data={federal_reserve_districts}
    x=name
    y=distinct_institutions
/>

## Line Chart
<LineChart
    data={federal_reserve_districts}
    x=name
    y=distinct_institutions
/>

## Scatter Plot
<ScatterPlot
    data={federal_reserve_districts}
    x=name
    y=distinct_institutions
/>

## Big Value
<BigValue data={federal_reserve_districts.filter(d => d.name == $page.params.district)} value=distinct_institutions/>