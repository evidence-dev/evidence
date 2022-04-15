---
sidebar_position: 5
---

# Run SQL Queries

## Run your first query

Go back to [localhost:3000/firstquery](http://localhost:3000/firstquery) and take a look at the query we weren't able to run earlier.

If your database connection has been set up successfully, you will see an output from the query and a message linking to an example analysis. 

* This message was set up with a [conditional](/templating#conditionals) - you can use conditionals to dynamically display information based on results of queries on your page. Check out the code in `firstquery.md` to see how this was done

## Write a query from scratch
Let's take a look at 1,000 rows from the Austin 311 Calls public dataset to undestand what the data looks like. We'll call this query `data_sample`:

````markdown title="Add to the bottom of src/pages/firstquery.md:"
```data_sample
    select * 
    from `bigquery-public-data.austin_311.311_service_requests` 
    limit 1000
```
````

Save the page and take a look at your browser. Evidence recognizes the change, runs your SQL query, and reloads the page to show the results inside a panel:

<div style={{textAlign: 'center'}}>

![query-viewer](/img/query-result-collapsed.png)
</div>

You can expand the panel to show the output of your query, as well as the SQL that was executed by the data warehouse:

<div style={{textAlign: 'center'}}>

![query-viewer](/img/query-result-expanded.png)
</div>


The **data scrubber** at the bottom of the table can be used to quickly look through a lot of rows. Once the page is loaded there are no calls to the database, so performance of the data on the page is very fast.

<div style={{textAlign: 'center'}}>

![table-scrub](/img/table-scrubber.gif)

</div>

## How Evidence runs queries
When you include SQL on your page, Evidence will run the queries and send the results to your browser to be displayed on the page. The time it takes to load the page is the time it takes to run the queries on that page.

Running queries doesn't prevent you from continuing to make edits to your document.

When you change any SQL on your page, it will cause a full page reload, but Evidence only reruns queries that have changed. 

:::note Running Large Queries
Evidence supports extremely large queries, but they can be slow to run in development mode and sometimes it's difficult to see the progress as it loads. We're working on a way to give you more feedback about the progress of large queries. It's usually a good idea to use a limit clause to avoid these issues.
:::


