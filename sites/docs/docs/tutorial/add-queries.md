---
sidebar_position: 3
hide_table_of_contents: false
---

# Add Queries

:::note Warning
You need a database connection to run queries. If you haven't already done so, [set up your database connection](/getting-started/connect-data-warehouse).
:::

We will be using two queries for our analysis. Copy and paste the queries below into your file under the appropriate headers.

<h2>Complaints by Day</h2>

````markdown title="Add this to austin-311/index.md after the 'Complaints by Day' header:"
```complaints_by_day
select
extract(date from created_date) as date, 
count(*) as complaints 

from `bigquery-public-data.austin_311.311_service_requests` 
 
group by date 
order by date desc
```
````

<h2>Complaints by Department</h2>

````markdown title="Add after the 'Complaints by Department' header:"
```complaints_by_department

select owning_department as department,
count(*) as complaints

from `bigquery-public-data.austin_311.311_service_requests` 

group by department
order by complaints desc
```
````

Your page should now look like this:

<div style={{textAlign: 'center'}}>

![austin-queries](/img/austin-queries.png)

</div>

Now that we have our data sources set up, let's move on to some interesting and powerful ways of displaying that data.