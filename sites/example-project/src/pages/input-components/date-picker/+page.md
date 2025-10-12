---
queries:
---

```sql seven_days_sales 
select 
  strftime(invoice_date, '%Y-%m-%d') as invoice_date
  , sum(total_sales) as sales_usd0
from orders
group by invoice_date
order by invoice_date desc limit 7
```


# Date Picker without Default set

<DateInput data={seven_days_sales} dates=invoice_date name=single_date/>



# Date Picker with Default set to End

<DateInput data={seven_days_sales} dates=invoice_date name=single_date_with_default inputDefault=end/>



