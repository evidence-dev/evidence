<script>
    let vvv = 129
</script>

```input 
select 
    complaint_description as description,
    extract(date from created_date) as date, 
    count(*) as number_of_complaints 
from `bigquery-public-data.austin_311.311_service_requests` 
where created_date >= timestamp_sub(current_timestamp(), interval 180 day)
group by 1,2 
limit 5
```

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 

<DataTable data={data.input}/>

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 

```working_reference 
    select count(*) as n_days from ${input}
```

<DataTable data={data.working_reference}/>


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
