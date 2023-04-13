```dates_state
select fed_reserve_district, date_trunc(established_date, year) as established_date, count(*) as banks
from `bigquery-public-data.fdic_banks.institutions`
where established_date >= '1960-01-01'
and established_date <= '2005-01-01'
group by fed_reserve_district, established_date
```

## Area

<AreaChart
data={dates_state.filter(d => d.fed_reserve_district === "San Francisco")}
x=established_date
/>

## Stacked Area

<AreaChart 
    data={dates_state} 
    x=established_date 
    y=banks 
    series=fed_reserve_district
/>
