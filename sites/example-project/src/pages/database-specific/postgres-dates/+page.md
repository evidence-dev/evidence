# Postgres Dates

```sql dates
select
    TO_DATE('2020-03-23', 'YYYY-MM-DD') as date,
    TO_DATE('March 23, 2020', 'Month DD, YYYY') as datef,
    TO_TIMESTAMP('2020-03-23', 'YYYY-MM-DD') as timestamp

```

{console.log(dates)}
