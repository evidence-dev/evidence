---
title: Row Based Data Table
queries:
  - orders_by_month: orders_by_month.sql
---


```sql last_3_months
select * 
from orders_by_month
order by month desc
limit 3
```


```markdown
<DataTable data={last_3_months} rows=all columnTitles=month columnTitlesFmt="mmm yy">
    <Row id=sales_usd0k/>
    <Row id=num_orders_num0 />
    <Row id=aov_usd2 description="Average Order Value"/>
</DataTable>
``` 


<DataTable data={last_3_months} rows=all columnTitles=month columnTitlesFmt="mmm yy">
    <Row id=sales_usd0k scaleColor=blue/>
    <Row id=num_orders_num0 />
    <Row id=aov_usd2 description="Average Order Value"/>
</DataTable>


