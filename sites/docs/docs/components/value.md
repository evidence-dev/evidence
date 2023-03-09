---
sidebar_position: 1
title: Value
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">&lt;Value/></span></h1>

The Value component accepts a query and displays a formatted value inline in text. 

By default, `Value` will display the value from the first row of the first column of the referenced data.

```markdown
<Value data={query_name} /> <!-- First row from the first column -->
```

## Specifying Rows and Columns 
Optionally supply a `column` and/or a `row` argument to display other values from `data`. 

```markdown
<!-- Show the 6th row from column_name -->
<Value 
    data={query_name}
    column=column_name 
    row=6
/>
```

## Example

**Markdown:**

```markdown
The most recent month of data began <Value data={monthly_orders} />,
when there were <Value data={monthly_orders} column=orders/> orders.
```

**Results:**
![summary-sentence](/img/tutorial-img/needful-things-value-in-text-nowindow.png)

## Adding a Placeholder
Override errors with the optional `placeholder` argument. This is useful for drafting reports *before* writing your queries.   

```markdown
<Value placeholder="Report Date"/>
```

![value-placeholder](/img/value-placeholder.png)

## All Options 
* **data** - query name, wrapped in curly braces
* **column** - (Optional) column name to pull values from
* **row** - (Optional) specific row number to display
* **placeholder** - (Optional) text to display in place of an error






