---
sidebar_position: 2
title: Including Data in Text
hide_title: false
hide_table_of_contents: false
---

In Evidence, you can include data directly in text by using the **<span class="gradient">&lt;Value/></span>** component. This component takes a query result and displays a value inline in your text. You can pass it a single value, a table of values with a row/column reference, or a specific hardcoded value you want to display.

<h1 class="community-header"><span class="gradient">&lt;Value/></span></h1>

```markdown
<Value 
    data={data.query_name} 
    column=your_column_name
    row=your_row_number
    value=pass_in_specific_value
    fmt=fmt_tag
/>
```

## Example

**Markdown:**

```markdown
The most recent month of data began <Value data={data.monthly_orders} fmt=date/>, 
when there were <Value data={data.monthly_orders} column=orders/> orders.
```

**Result on Webpage:**
![summary-sentence](/img/tutorial-img/needful-things-value-in-text-nowindow.png)

## Options

### Showing Data from a Query Result
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **column** - column name to pull values from
* **row** - (Optional) specific row number to display

### Showing a Specific Value
* **value** - specific value to display (e.g., `value=300`)

### Formatting
* **fmt** - use a [format tag](/features/queries/number-formatting) to override the default formatting

## Default Behaviour
* **<span class="gradient">&lt;Value/></span>** pulls the first row in a table
* If no column is specified, it will select the first column in the dataset (furthest left column)

## Errors
Errors appear inline with your text - when you hover over an error, it will show you the reason for the error.
![value-error](/img/value-error.gif) width="650"/>

## Adding a Placeholder
If you like to mock up reports before you're ready to fill in real data, you can also override the Value error with a **placeholder**. Input the text you want to use as your placeholder and it will appear in blue font with square brackets, inline with your text.

* **placeholder** - text to display in place of an error

```markdown
<Value placeholder="Report Date"/>
```

![value-placeholder](/img/value-placeholder.png)




