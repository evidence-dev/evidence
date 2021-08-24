---
sidebar_position: 6
hide_table_of_contents: false
---

# Use Query Results in a Sentence
One of the most effective (and underappreciated) ways of presenting data is to simply include it in text. Despite what your BI sales rep might tell you, the written word is still the most powerful and accessible communication tool there is.

<h2>Include a Value In Your Text</h2>

Evidence's [<span class="gradient">**&lt;Value/>**</span>](/components/value) component lets you include the result of a query directly in the text on your page.

Copy and paste the sentence below into your markdown file.

```markdown title="Add to austin-311/index.md after the 'Summary' header:"
The most recent day of data was logged on <Value data={data.complaints_by_day} fmt=date/> and the number of complaints was <Value data={data.complaints_by_day} column="complaints"/>.
```

**Result:**
<div style={{textAlign: 'center'}}>

![summary-sentence](/img/austin-summary-text-2.png)

</div>
These values will continue to update as the results of your SQL query change. You should see a more recent date than the screenshot above when you run your query.

<h2>Updated Page</h2>

Here's what our page looks like now:

<div style={{textAlign: 'center'}}>

![after-add-sentence](/img/austin-after-summary.png)

</div>

Now that we have our query results showing up directly in the text of our page, we don't need our audience to see the underlying data or code. 

<h2>Hide Sources</h2>

Evidence lets you choose what's visible with the Show/Hide Sources button at the top of each page. Click that button to hide the sources and make the page look cleaner:

<div style={{textAlign: 'center'}}>

![after-hide-sources](/img/austin-after-hide.png)

</div>

When you are in development mode, queries are shown by default. In production, queries are hidden by default.

Anyone reading the page can still look at the queries by clicking Show Sources. We think this will be powerful for analysts who want to understand how a metric was calculated or see the source data behind a number.

<div style={{textAlign: 'center'}}>

![show-hide-sources](/img/austin-hide-show.gif)

</div>