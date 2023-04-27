---
title: Expressions
---

```sql orders
SELECT
    date_trunc('month', order_datetime) AS month,
    count(*) AS num_orders,
    sum(sales) as total_sales
FROM orders
GROUP BY 1
order by 1 desc
```

## Number formatting

You can use the `fmt()` function to format expressions using Excel-style format strings.

```javascript
fmt(number, excelFormatString);
```

Last month, there were {fmt(orders[0].num_orders,'#,##0')} orders, a change of:

- **{fmt(orders[0].num_orders-orders[1].num_orders,'+#,##0;-#,##0;0')}** ({fmt(orders[0].num_orders/orders[1].num_orders-1,'+0.0%;-0.0%')}) vs the previous month.
- **{fmt(orders[0].num_orders-orders[12].num_orders,'+#,##0;-#,##0;0')}** ({fmt(orders[0].num_orders/orders[12].num_orders-1,'+0.0%;-0.0%')}) vs last year.

## Date formatting does not work reliably

This is because dates are stored as strings.

Last month was {fmt(orders[0].month, 'MMMM')}.

Last month was {fmt(new Date(orders[0].month), 'MMMM')}. (wrong)
