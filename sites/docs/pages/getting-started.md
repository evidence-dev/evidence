---
sidebar_position: 3
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

<Alert status="info">
   # Title
   **By the end of this 10 minute guide, you will be able to:**
   - Create and edit a page in Evidence
   - Write a query on demo data
   - Create a table
   - Create a chart
   - Connect a new CSV data source
</Alert>


<Alert status="info">
Casey note: I like how the Rails tutorial calls out what you'll achieve, and adds these satisfying green checkmarks. I think it makes the reader feel good and excited. Baked my own CSS for this, happy to change to your suggestions
</Alert>

## Prerequisites

Please ensure that you have already installed Evidence: [Install Evidence](/install-evidence).

New to web development? Start with the [Basics](#basics).

Familiar with running a server at `localhost`, and writing pages in Markdown? Skip to [Working with data](#working-with-data).

# Basics
## 1. Start Evidence

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

## 2. Add a new page

Go back to VSCode (or your file editor of choice) and open the `src/pages` directory. Right-click on the `pages` directory and select `New File`. Name the file `new-page.md`, or a name of your choice.

Add the following to the file and save it (`Ctrl+S` or `Cmd+S`):

```markdown
## Hello Evidence

This is a new page in Evidence.
```

Head back to Evidence in your browser. You should see your new page in the sidebar. If not, refresh:

![New page in Evidence](/img/getting-started/new_page.png)

## 3. Make more changes
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

# Working with data
## 4. Understand data sources and queries

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

## 5. Set up a source query
Add a new `.sql` file to the `sources/needful_things` directory. Name it `my_query.sql`, or a name of your choice.

Perhaps you're only interested in the categories of your orders for now. In this file, write a query to select just the `category` column from the `orders` table:

**my_query.sql**
```sql
SELECT category FROM orders
```

Save the file. Later, you'll be able to refer to this data source as `needful_things.my_query`.

## 4.5 Run sources

Once you have configured source queries, you need to **run sources** to actually execute them.

If your local development server is running, sources will run automatically by default when you make changes to your source queries or configuration. This behaviour can be disabled.

To run sources manually from the Command Line:

```bash
npm run sources
```

<div id="objectives" class="alert svelte-17118v7">
<strong>Why would you want to manually run sources?</strong>
<br/>
If you're working with large data sources, running queries can be slow. You may not need the latest data while you are building a page, or designing charts.
<br/><br/>
 Not running automatic queries while you are working will allow for faster page loads, and speed up the process of iteration.
<br/><br/>
When the page is complete, you can then run sources to reflect the latest data. To learn more about running sources efficently, take a look at Core Concepts > <a href="/core-concepts/data-sources/">Data Sources</a>. #TODO fix link
</div>


## 5. Create a table

Quick brown fox

## 6. Create a chart

Neque porro quisquam est qui dolorem ipsum 

## 7. Connect a new CSV data source

Nullam fermentum, ex ac volutpat porta,

# Next steps

<Alert status="info">
TODO: suggestions for extending the tutorial, and pathways into further documentation
</Alert>

## Help and support
If you run into any issues, [reach out in Slack.](https://slack.evidence.dev)

<Alert status="info">
TODO / thought: Not sure how much Slack retention history you guys have, but it might be nice to have a dedicated channel for tutorial support, so users can search for their issue in case someone else has already encountered it. Or post new ones (i.e. if this tut goes out of date)
</Alert>
