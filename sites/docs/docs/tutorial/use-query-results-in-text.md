---
sidebar_position: 5
hide_table_of_contents: false
title: Use Query Results in Text
---

One effective (and underappreciated) way of presenting data is to simply include it in text. Despite what your BI sales rep might tell you, the written word is still one of the most powerful and accessible communication tools.

<h2>Include a Value In Your Text</h2>

Evidence's [<span class="gradient">**&lt;Value/>**</span>](/features/markdown/value) component lets you include the result of a query directly in the text on your page.

Copy and paste the sentence below into your markdown file.

```markdown title="Add to business-performance.md below the 'monthly_orders' query:"
The most recent month of data began <Value data={monthly_orders}/>,
when there were <Value data={monthly_orders} column=orders/> orders.
```

**Result:**
<div style={{textAlign: 'center'}}>

![summary-sentence](/img/tutorial-img/needful-things-value-in-text-nowindow.png)

</div>
These values will continue to update as the results of your SQL query change, for example, if more recent data is added.

<h2>Updated Page</h2>

Here's what our page looks like now:

<div style={{textAlign: 'center'}}>

![after-add-sentence](/img/tutorial-img/needful-things-value-in-text-v2.png)

</div>

Now that we have our query results showing up directly in the text of our page, we don't need our audience to see the underlying data or code. 

<h2>Hide Sources</h2>

Evidence lets you choose what's visible with the Show/Hide Sources button at the top of each page. Click that button to hide the sources and make the page look cleaner:

<div style={{textAlign: 'center'}}>

![show-hide-sources](/img/tutorial-img/needful-things-show-hide-queries-v2.gif)

</div>

When you are in development mode, queries are shown by default. In production, queries are hidden by default.

Anyone reading the page can still look at the queries by clicking Show Queries. We think this will be powerful for analysts who want to understand how a metric was calculated or see the source data behind a number.

