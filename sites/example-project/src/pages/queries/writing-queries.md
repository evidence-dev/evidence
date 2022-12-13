# Writing Queries 

## A working query 

```working_query
    
select 
13 as metric, 
current_date() as today

```

## A broken query 

```broken_query

select 100/2 as whoops 

```

{JSON.stringify(data.working_query)}

{JSON.stringify(working_query)}