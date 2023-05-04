```federal_reserve_districts
    select
        fed_reserve_district as name,
        count(distinct institution_name) as distinct_institutions,
        from `bigquery-public-data.fdic_banks.institutions`
    group by 1
```

# Details for <Value data={federal_reserve_districts.filter(d => d.name === $page.params.district)} column=name/>

<DataTable data={federal_reserve_districts.filter(d => d.name == $page.params.district)} />

```over_time
select fed_reserve_district, date_trunc(established_date, year) as established_date, count(*) as banks
from `bigquery-public-data.fdic_banks.institutions`
where established_date >= '1960-01-01'
and established_date <= '2005-01-01'
group by fed_reserve_district, established_date
```

<LineChart
data={over_time.filter(d => d.fed_reserve_district === $page.params.district)}
    x=established_date
    y=banks
    title="Banks Established By Year in {$page.params.district}"
/>
