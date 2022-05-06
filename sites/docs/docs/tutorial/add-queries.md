---
sidebar_position: 4
hide_table_of_contents: false
title: Add Queries
---

Let's making a new page for our queries. Create a new markdown page called `business-performance.md` (in the same file as `index.md`), adding the following code to create the sections, and add a query

````markdown title="Add this to business-performance.md"
# Business Performance
Below is a summary of Needful Things' sales.

```monthly_orders

select
    order_month,
    count(sales) as orders,
    sum(sales) as sales_usd,
    sum(sales) / count (sales) as basket_size
from orders
group by order_month
order by order_month desc
```
````

Your page should now look like this:

<div style={{textAlign: 'center'}}>

![needful-things-queries](/img/tutorial-img/needful-things-queries-v2.png)

</div>

You can see both the query SQL, and the resulting data using the dropdowns.

<div style={{textAlign: 'center'}}>

![needful-things-queries](/img/tutorial-img/needful-things-explore-queries-v2.gif)

</div>

Now that we have our data sources set up, let's move on to some interesting and powerful ways of displaying that data.