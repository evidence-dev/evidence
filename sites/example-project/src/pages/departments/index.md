# Departments

```complaints_by_dept
    select 
        owning_department as department,
        count(*) as complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1
    order by 2 desc
```

{#each data.complaints_by_dept as cbdept}

* [{cbdept.department}](/departments/{cbdept.department}): <Value value={cbdept.complaints} />

{/each}


