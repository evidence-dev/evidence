---
sidebar_position: 4
hide_table_of_contents: false
title: Build your first dashboard
description: A 10 minute guide to building your first dashboard in Evidence.
---
<style>
:root {
	--lightest-gray: #dee2e6;
  }

#objectives {
	background-color: var(--lightest-gray);
	padding: 1rem;
}

#objectives ul li {
	list-style-image: url(/img/getting-started/check.svg);
	margin-left: 1rem;
}

.tab-bottom-padding {
   margin-bottom: 2rem;
}

.tut-img {
	margin: 1rem;
}
</style>

<div id="objectives" class="alert svelte-17118v7">
<strong>By the end of this 10 minute guide, you will be able to:</strong>
<ul>
   <li>Create and edit a page in Evidence</li>
   <li>Write a query on demo data</li>
   <li>Create a table</li>
   <li>Create a chart</li>
   <li>Connect a new CSV data source</li>
</ul>
</div>

<Alert> 

  **By the end of this 10 minute guide, you will be able to:** 
  - Create and edit a page in Evidence 
  - Write a query on demo data 
  - Create a table 
  - Create a chart 
  - Connect a new CSV data source 

</Alert>

## Prerequisites

Please ensure that you have already installed Evidence: [Install Evidence](/install-evidence).

New to web development? Start with the [Basics](#basics).

Familiar with running a server at `localhost`, and writing pages in Markdown? Skip to [Working with data](#working-with-data).

## Basics
### 1. Start Evidence

You can start Evidence from VSCode, or from the Command Line. Both will work for this tutorial. If you're unsure, start with VSCode:

<div class="tab-bottom-padding">
<Tabs>
   <Tab label="VSCode">

      Click `Start Evidence` in the bottom status bar:

      <img src="/img/getting-started/start_evidence.png" width="300" class="tut-img"/>
   </Tab>
   <Tab label="Command Line">

      From the root of your project directory: 
      
      `npm run dev`
      
   </Tab>
</Tabs>
</div>

If you chose a different setup during [Install Evidence](/install-evidence/#other-options), use the command that matches your setup.

Your browser should open automatically. If it doesn't, open your browser and navigate to `localhost:3000` in the address bar. You should see your Evidence project:

![Evidence landing page](/img/getting-started/evidence_landing.png)

Congratulations! You've started Evidence. You are now running a local development server.

<div id="objectives" class="alert svelte-17118v7">
<strong>What's a development server?</strong>
<br/>
Dev server? localhost:3000? Hot reload? Static site generator? If you're new to web development, this tutorial will introduce some unfamiliar terms. Don't worry.
<br/><br/>
It's not required for this tutorial, but if you want to find out more about what's going on under the hood, take a look at this FAQ about local development. [TODO add link]
</div>

<Alert>

**What's a development server?**

Dev server? localhost:3000? Hot reload? Static site generator? If you're new to web development, this tutorial will introduce some unfamiliar terms. Don't worry.
<br/>
It's not required for this tutorial, but if you want to find out more about what's going on under the hood, take a look at this FAQ about local development. [TODO add link]
</Alert>


### 2. Add a new page

Go back to VSCode (or your file editor of choice) and open the `src/pages` directory. Right-click on the `pages` directory and select `New File`. Name the file `new-page.md`, or a name of your choice.

Add the following to the file and save it (`Ctrl+S` or `Cmd+S`):

```markdown
## Hello Evidence

This is a new page in Evidence.
```

Head back to Evidence in your browser. You should see your new page in the sidebar. If not, refresh:

![New page in Evidence](/img/getting-started/new_page.png)

### 3. Write Markdown
Make some more changes to the page. You'll see them reflected "live" in the browser, immediately after saving. There is no need to restart the server. 

This is called **hot reloading**, and it allows you to see your changes in real-time.

Evidence pages are `.md` files, and are written in a popular language called Markdown. You can learn more about Markdown [here](https://docs.evidence.dev/reference/markdown/).

You can also insert HTML directly into your page if you need more control.

Here are some examples of Markdown and HTML to try:

```markdown
## Hello Evidence

This is a new page in Evidence.

### This is a lower level header
This is some *italic* and **bold** text.

This is a [link](https://evidence.dev).

This is an image inserted using Markdown: 
![alt text](https://evidence.dev/brand-assets/wordmark-black.png)

This is an image inserted using HTML:
<img src="https://evidence.dev/brand-assets/wordmark-black.png" alt="evidence logo" width="200"/>

```

And here's how it will look when rendered in the browser:

![Markdown rendered in Evidence.](/img/getting-started/markdown_html.png)

Now that you know how to create and edit pages, let's move on to working with data.

## Working with data
### 4. Understand data sources and queries

Navigate to `localhost:3000/settings` in your browser.

Here you'll find our demo dataset, `needful_things`. It is a [DuckDB](https://duckdb.org/) database, which is one of many databases that Evidence supports.

![The Evidence settings page.](/img/getting-started/duck_db.png)

Later in this tutorial you will learn how to load a new data source. For now, we will use `needful_things` to write a **source query**.

A data source in Evidence consists of 3 parts:

1. The **data source** itself. In our example, all of our data sits within a file called `needful_things.duckdb`.
2. **Source queries** allow you to filter and transform your data source before using it on a page. You may not need all of the tables from `needful_things`, or you may only need a few columns from a certain table. Your source query should be written in the dialect of SQL that matches your data source. A single data source can have multiple source queries.
3. A **connection.yaml** file. Any configuration or credentials needed to connect to your data source should be defined here. This file is automatically generated when you create a new data source via the `/settings` page.

You will see this reflected in the folder structure for each data source under the `sources` folder:
<img src="/img/getting-started/sources.png" width="70%" class="tut-img"/>

### 5. Set up a source query
Add a new `.sql` file to the `sources/needful_things` directory. Name it `my_query.sql`, or a name of your choice.

Perhaps you're only interested in the categories of your orders for now. In this file, write a query to select just the `category` column from the `orders` table:

**my_query.sql**
```sql
select category from orders
```

Save the file. Later, you'll be able to refer to this data source as `needful_things.my_query`.

### 4.5 Run sources

Once you have configured source queries, you need to **run sources** to actually execute them.

If your local development server is running, sources will run automatically by default when you make changes to your source queries or configuration. This behaviour can be disabled.

To run sources manually from the Command Line:

```bash
npm run sources
```

<div id="objectives" class="alert svelte-17118v7">
   
<strong>Why would you want to manually run sources?</strong>

If you're working with large data sources, running queries can be slow. You may not need the latest data while you are building a page, or designing charts.


 Not running automatic queries while you are working will allow for faster page loads, and speed up the process of iteration.


When the page is complete, you can then run sources to reflect the latest data. To learn more about running sources efficently, take a look at Core Concepts &gt; [Data Sources](/core-concepts/data-sources/).
</div>

<Alert>

**Why would you want to manually run sources?**

If you're working with large data sources, running queries can be slow. You may not need the latest data while you are building a page, or designing charts.
<br/>

Not running automatic queries while you are working will allow for faster page loads, and speed up the process of iteration.
<br/>

When the page is complete, you can then run sources to reflect the latest data. To learn more about running sources efficently, take a look at Core Concepts &gt; [Data Sources](/core-concepts/data-sources/).

</Alert>

### 6. Set up a Markdown Query
Before you can use a data source on your page, you need to set up a **Markdown query** for it.

Clean up everything from your page, and add the following:

**new-page.md**
````markdown
## Hello Evidence

### Orders Table

```my_query_summary
select * from needful_things.my_query
```
````
Refresh, and you'll see this. Not very exciting, but we'll use this data in the next section.

TODO add image

<div id="objectives" class="alert svelte-17118v7">

**What's the difference between a Source Query and a Markdown Query?**

A **source query** filters and transforms data at the database level. It is written in the dialect of SQL that matches your data source. You can choose the timing of source queries by running them manually. This may be useful when working with data sources that are slow to query (i.e large datasets, or data accessed over a network).


A **Markdown query** filters and transforms data at page level. It is always written in the DuckDB dialect. Markdown queries run with every page load, so any changes will be instantly reflected in charts and tables.

To learn more about Markdown queries, including how to reuse them across pages, take a look at Core Concepts &gt; [Markdown Queries](/core-concepts/queries/).
</div>


## Adding components

### 6.5. Create a Data Table

One simple way to display data is with a [Data Table](/components/data-table/):

**new-page.md**
````markdown
## Hello Evidence

### Orders Table

```my_query_summary
select * from needful_things.my_query
```

<DataTable data={my_query_summary}/>
````

Refresh the page in your browser, and you should see:

![A DataTable in Evidence](/img/getting-started/new_table.png)

Nice! You just made your first Evidence component. Now, let's refine things a bit.

The Markdown query isn't doing much for us right now. It's simply displaying all 10,000 records and all columns. We can make it more useful.

Let's say we want to pull the 100 most recent orders, in order to send these customers a discount code. Change the Markdown query to:

````markdown
```my_query_summary
select 
   order_datetime, 
   first_name, 
   last_name, 
   email 
from needful_things.my_query
order by order_datetime desc
limit 100
```
````

Now refresh, and notice that your table has changed to show only the most recent 100 orders, with only the table columns you specified:

![Edited markdown query](/img/getting-started/edited_markdown_query.png)

You can further select or rename the columns that appear in your table by specifying them in the `DataTable` component:

```markdown
<DataTable data={my_query_summary}>
   <Column id=order_datetime title="Order Date"/>
   <Column id=first_name />
   <Column id=email />
</DataTable>
```  
This will display:

![Edited columns](/img/getting-started/edited_columns.png)

A Data Table is a built-in **component** of Evidence, and there are many more. To see a full list of components, take a look at the left-hand sidebar, or go to [All Components](/components/all-components/).

### 6. Create a Bar Chart

Next, let's visualize orders over the past year using a [Bar Chart](/components/bar-chart). Add the following to your page:

````markdown
### Orders by Month

```orders_by_month
select order_month, count(*) as orders from needful_things.my_query
group by order_month order by order_month desc
limit 12
```
<BarChart 
    data={orders_by_month} 
    x=order_month 
    y=orders
	xFmt="mmm yyyy"
	xAxisTitle="Month"
	yAxisTitle="Orders"
/>
````
And you should see:

![Bar chart](/img/getting-started/bar_chart.png)

### 7. Connect a new CSV data source

Go to `localhost:3000/settings`, and select **Add new source**:

![Add new source](/img/getting-started/add_new_source.png)

Choose **CSV** as the source type, and upload a CSV file of your choice.

Here, we'll use [**us_alt_fuel_stations.csv**](https://datacatalog.urban.org/node/6463/revisions/15648/view) - a public data source on EV charging stations across the US.

Select Source Type: **CSV**, and give your source a name. Hit Confirm:

![Add new source](/img/getting-started/add_new_source2.png)

You can read about various configuration options for CSV files [here](https://docs.evidence.dev/core-concepts/data-sources/#csv-files). For now, leave this blank, and hit **Confirm Changes**:

![Add new source](/img/getting-started/add_new_source_confirm_changes.png)

You should now see your new source under the sources folder. Copy your CSV file into it:

![Add new source](/img/getting-started/add_new_source4.png)

That's it! You've set up a new data source. If you'd like to use it, try adding the following Markdown Query and the [USMap](/components/us-map) component:

````markdown
### EV Map
```ev_map
select State, count(*) AS ev_station_count from ev_stations.us_alt_fuel_stations
where State not in ('CA')
group by State order by ev_station_count desc
```

<USMap data={ev_map} state=State abbreviations=true value=ev_station_count/>
````

And you should see:

![US EV Map](/img/getting-started/us_map.png)

That's it! You now know the basics of setting up data sources, writing queries, and creating components in Evidence.

## Next steps

<Alert status="info">
TODO: suggestions for extending the tutorial, and pathways into further documentation
</Alert>

### Help and support
If you run into any issues, [reach out in Slack.](https://slack.evidence.dev)

<Alert status="info">
TODO / thought: Not sure how much Slack retention history you guys have, but it might be nice to have a dedicated channel for tutorial support, so users can search for their issue in case someone else has already encountered it. Or post new ones (i.e. if this tut goes out of date)
</Alert>
