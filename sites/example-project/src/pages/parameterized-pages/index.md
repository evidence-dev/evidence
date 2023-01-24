

```federal_reserve_districts
select 
    upper(fed_reserve_district) as name, 
    "/parameterized-pages/" || upper(fed_reserve_district) || "/" as link,
    count(distinct institution_name) as distinct_institutions,
from `bigquery-public-data.fdic_banks.institutions`
group by 1,2
```

# Federal reserve districts 

<DataTable data={federal_reserve_districts} link=link/>


```categories
select 
category,
'/parameterized-pages/' || category || '/' as link,
sum(sales) as sales_usd
from orders
group by 1
```

<DataTable data={categories} link=link/>

