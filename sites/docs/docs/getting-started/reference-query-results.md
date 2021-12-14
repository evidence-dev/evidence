---
sidebar_position: 8
---

# Reference Query Results on Your Page
You can include query results on your page using Evidence's built-in component library. Evidence components include things like charts, tables, and graphs. 

## How to Reference Query Results
Each query result is stored as an object with the same name as the query title. 

Evidence stores all query result objects for a page in one `data` object.

You can reference a query result object using the notation below:

```markdown
{data.query_title}
```

This notation is what will be used to pass query results to Evidence components.

## How to Use Evidence Components
Evidence components require a reference to a query result and arguments specific to the component you're using. You can find a list of components and their arguments in the Components section.

We'll use Evidence's [<span class="gradient">**&lt;Value/>**</span>](/components/value) component as an example. 

[<span class="gradient">**&lt;Value/>**</span>](/components/value) lets you include the result of a query directly in the text on your page.

Under the `data_sample` query you wrote in the last section, paste the code below:

```markdown
<Value data={data.data_sample} column=owning_department/>
```

## What's Next
Congratulations - you set up your project, connected to your data warehouse, ran a SQL query, and referenced that query on your page.

If you made it this far, [please reach out to us on Slack.](/community) We would love to hear from you.

In the next tutorial, we'll show you how to build a full analysis from scratch, including charts, inserting query results into text, loops, conditionals, and more.



