<script>
    let vvv = 129
</script>

# Query Chaining

```sql orders_by_category
select
    date_trunc('month', order_datetime) as month,
    category,
    sum(sales) as sales_usd0k,
    count(sales) as num_orders_num0,
    sales_usd0k / count(sales) as aov_usd2
from orders
group by month, category
order by month, sales_usd0k desc
```

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

<DataTable data={orders_by_category}/>

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

```working_reference
select count(*) as n_months from ${orders_by_category}
```

<DataTable data={working_reference}/>

```two_step_reference
select
    n_days / 365 as approx_years
from ${working_reference}
```

```missing_reference
select
    count(*) as n_days
from ${}
```

```incorrect_reference
select
    count(*) as n_days
from ${doesnt_exist}
```

```circular_reference_1
select * from ${circular_reference_2}
```

```circular_reference_2
select * from ${circular_reference_1}
```

```missing_close_bracket
select
    n_days / 365 as approx_years
from ${working_reference
```

```missing_opening_bracket
select
    n_days / 365 as approx_years
from working_reference}
```
