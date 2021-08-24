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
    value=pass_in_specific_value
    fmt=fmt_tag
/>
```
### Showing Data from a Query Result
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **column** - column name to pull values from
* **row** - (Optional) specific row number to display

### Showing a Specific Value
* **value** - specific value to display (e.g., `value=300`)

### Formatting
* **fmt** - use a [format tag](/formatting/format-tags) to override the default formatting

### Default Behaviour
* **<span class="gradient">&lt;Value/></span>** pulls the first row in a table
* If no column is specified, it will select the first column in the dataset (furthest left column)


:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::




