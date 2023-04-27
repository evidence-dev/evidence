---
title: Expressions
---

```sql orders
SELECT '2022-12-01' AS month, 645 AS num_orders, 987 AS sales
UNION ALL
SELECT '2022-11-01' AS month, 752 AS num_orders, 960 AS sales
UNION ALL
SELECT '2022-10-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-09-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-08-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-07-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-06-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-05-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-04-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-03-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-02-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2022-01-01' AS month, 1000 AS num_orders, 1000 AS sales
UNION ALL
SELECT '2021-12-01' AS month, 600 AS num_orders, 600 AS sales
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
