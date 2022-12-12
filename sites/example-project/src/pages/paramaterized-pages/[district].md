
```federal_reserve_districts
    select 
        fed_reserve_district as name, 
        count(distinct institution_name) as distinct_institutions,
        from `bigquery-public-data.fdic_banks.institutions`
    group by 1
```

# {$page.params.district}

<DataTable data={federal_reserve_districts.filter(d => d.name == $page.params.district)} />

