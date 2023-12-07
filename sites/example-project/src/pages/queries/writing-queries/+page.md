# Writing Queries

## A working query

```sql working_query

select
13 as metric,
current_date() as today

```

## A broken query

```sql broken_query

select 100/2 as whoops

```

{JSON.stringify(data.working_query)}

{JSON.stringify(working_query)}


```sql working_query_with_extraordinarily_long_and_verbose_name

select
1 + 1 as metric,
current_date() as today

```