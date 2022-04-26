---
sidebar_position: 3
hide_table_of_contents: false
---

# Add Queries


Let's making a new page for our queries. Create a new markdown page called `business-performance.md` (in the same file as `index.md`), adding the following code to create the sections:

````markdown title="Add this to business-performance.md"
# Business Performance
Below is a summary of Needful Things' sales.

## Monthly Orders

## Product Performance
````

We will be using two queries for our analysis. Copy and paste the queries below into your file.

<h2>Monthly Orders</h2>

````markdown title="Add this to business-performance.md after the 'Monthly Orders' header:"
```monthly_orders
select
    order_month,
    count(*) as orders
from orders

group by order_month
order by order_month desc
```
````

<h2>Product Performance</h2>

````markdown title="Add after the 'Product Performance' header:"
```product_performance
select
    item,
    sum(sales) as item_sales
from orders

group by item
order by item_sales desc
```
````

Your page should now look like this:

<div style={{textAlign: 'center'}}>

![needful-things-queries](/img/tutorial-img/needful-things-queries.png)

</div>

You can see both the query SQL, and the resulting data using the dropdowns.

<div style={{textAlign: 'center'}}>

![needful-things-queries](/img/tutorial-img/needful-things-explore-queries.gif)

</div>

Now that we have our data sources set up, let's move on to some interesting and powerful ways of displaying that data.