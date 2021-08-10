---
sidebar_position: 1
hide_title: true
hide_table_of_contents: false
---

# Value
<h1 class="community-header"><span class="gradient">&lt;Value/></span></h1>

Lets you take the result of a query and use it anywhere in your markdown.

```markdown
<Value 
    data={data.query_name} 
    column=your_column_name
    row=your_row_number
/>
```
### Required Props
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **column** - column name to pull values from
* **row** - (Optional) specific row number to display

### Default Behaviour
* **<span class="gradient">&lt;Value/></span>** pulls the first row in a table
* If no column is specified, it will select the first column in the dataset (furthest left column)


:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::




