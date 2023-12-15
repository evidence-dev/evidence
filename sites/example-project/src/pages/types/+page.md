---
queries: 
- returns_by_reason.sql
- monthly_returns_by_reason.sql
---

# Integers 

```sql tables
select * from tables
```


```sql all_types
select 
    *
from test_all_types()
limit 2
```

<DataTable data={all_types} search=true/>

## Integers

### tinyint

<BarChart 
    data={all_types}
    x="varchar"
    y="tinyint"
/>

My tinyint is <Value data={all_types} column="tinyint" />

### smallint

<BarChart 
    data={all_types}
    x="varchar"
    y="smallint"
/>

My smallint is <Value data={all_types} column="smallint" />

### int

<BarChart 
    data={all_types}
    x="varchar"
    y="int"
/>

My int is <Value data={all_types} column="int" />

### bigint

<BarChart 
    data={all_types}
    x="varchar"
    y="bigint"
/>

My bigint is <Value data={all_types} column="bigint" />

### hugeint

<BarChart 
    data={all_types}
    x="varchar"
    y="hugeint"
/>

My hugeint is <Value data={all_types} column="hugeint" />

### utinyint

<BarChart 
    data={all_types}
    x="varchar"
    y="utinyint"
/>

My utinyint is <Value data={all_types} column="utinyint" row=1/>   

### usmallint

<BarChart 
    data={all_types}
    x="varchar"
    y="usmallint"
/>

My usmallint is <Value data={all_types} column="usmallint" row=1/>   

### uint

<BarChart 
    data={all_types}
    x="varchar"
    y="uint"
/>

My uint is <Value data={all_types} column="uint" row=1/>   

### ubigint

<BarChart 
    data={all_types}
    x="varchar"
    y="ubigint"
/>

My ubigint is <Value data={all_types} column="ubigint" row=1/>   


