# Dropdown

```sql categories
select category from orders group by all
```

```sql years
select 2019 as year 
union all 
select 2020 as year
union all
select 2021 as year
```

<Dropdown data={categories} name=category value=category/>

<Dropdown data={years} name=year value=year/>

```sql orders
select * from orders
where category = '${inputs.category}'
and date_part('year', order_datetime) = '${inputs.year}'
```