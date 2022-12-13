

```federal_reserve_districts
select 
    fed_reserve_district as name, 
    count(distinct institution_name) as distinct_institutions,
    from `bigquery-public-data.fdic_banks.institutions`
group by 1
```

# Federal reserve districts 

{#each federal_reserve_districts as district}

  [{district.name}](/paramaterized-pages/{district.name})

{/each}


