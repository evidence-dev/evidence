# Queries 

## A working query

```working_query
select 
    1113133 as metric, 
    current_date() as today
```

<Value data = {data.working_query} />


## A broken query 

```broken_query

select 100/0 as whoops

```
