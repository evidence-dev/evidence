---
sidebar_position: 2
title: Including Data in Text
hide_title: true
hide_table_of_contents: false
---

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
* **fmt** - use a [format tag](/queries/number-formatting) to override the default formatting

### Default Behaviour
* **<span class="gradient">&lt;Value/></span>** pulls the first row in a table
* If no column is specified, it will select the first column in the dataset (furthest left column)

### Errors
Errors appear inline with your text - when you hover over an error, it will show you the reason for the error.
<img src="/static/img/value-error.gif" width="650"/>

### Adding a Placeholder
If you like to mock up reports before you're ready to fill in real data, you can also override the Value error with a **placeholder**. Input the text you want to use as your placeholder and it will appear in blue font with square brackets, inline with your text.

* **placeholder** - text to display in place of an error

```markdown
<Value placeholder="Report Date"/>
```

![value-placeholder](/img/value-placeholder.png)




