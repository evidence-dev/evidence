---
sidebar_position: 4
---

# Edit Your Project

## Pages
Your project comes with a `pages` directory, which you can fill with markdown files. When you run your project, Evidence builds a webpage for each of those markdown files.

Each markdown page in your project corresponds to a URL. For example:  
`pages/marketing.md` = `localhost:3000/marketing`

Add folders inside the `pages` directory to create sections in your project. For example:  
`pages/departments/marketing.md` = `localhost:3000/departments/marketing`
 
## Editing Markdown
The Evidence development server is extraordinarily fast. When you edit text on a markdown page and save it, your webpage will update almost instantly.

For tips on markdown syntax, check out [Markdown Guide.](https://www.markdownguide.org/cheat-sheet/)

## Queries

### Writing queries
In Evidence you write SQL in fenced code blocks, like this:

````markdown
```my_first_query

select 
    101 as my_first_metric,
    200 as my_second_metric

```
````
Every query in Evidence needs a title. The title of the query above is `my_first_query`.

Query titles must be unique within a document, but can be reused across documents.

### Viewing queries
Evidence displays queries on a webpage like this:

<div style={{textAlign: 'center'}}>

![query-viewer](/img/query-result-collapsed.png)
</div>

You can expand the panel to show the output of your query, as well as the SQL that was executed by the data warehouse:

<div style={{textAlign: 'center'}}>

![query-viewer](/img/query-result-expanded.png)
</div>

The data scrubber at the bottom of the table can be used to quickly look through a lot of rows. Once the page is loaded there are no calls to the database, so performance of the data on the page is very fast.

<div style={{textAlign: 'center'}}>

![table-scrub](/img/table-scrubber.gif)

</div>

### How Evidence runs queries
When you include SQL on your page, Evidence will run the queries and send the results to your browser to be displayed on the page. The time it takes to load the page is the time it takes to run the queries on that page.

Running queries doesn't prevent you from continuing to make edits to your document.

When you change any SQL on your page, it will cause a full page reload, but Evidence only reruns queries that have changed. 

:::note Running Large Queries
Evidence supports extremely large queries, but they can be slow to run in development mode and sometimes it's difficult to see the progress as it loads. We're working on a way to give you more feedback about the progress of large queries. It's usually a good idea to use a limit clause to avoid these issues.
:::


## Components
You can include query results on your page using Evidence's built-in component library. Evidence components include things like charts, tables, and graphs. 

All query results on a page are returned to a single object called `data`. To use a query result, you need to reference the query name as a subset of that `data` object. These references can be used in any of the components from our built-in library.

For example, if your query name was `regional_sales_change`, you could include a bar chart like this:
```markdown
<BarChart 
    data={data.regional_sales_change}
    x=region
    y=sales_change
/>
```

![bar](/img/exg-bar-nt.svg) 