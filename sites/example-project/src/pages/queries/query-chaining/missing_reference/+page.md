```sql incorrect_reference
select
    count(*) as n_days
from ${doesnt_exist}
```