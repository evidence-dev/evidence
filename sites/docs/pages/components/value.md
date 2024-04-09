---
title: Value
sidebar_position: 1
---

The Value component accepts a query and displays a formatted value inline in text.

By default, `Value` will display the value from the first row of the first column of the referenced data.

```markdown
<Value data={query_name} /> <!-- First row from the first column -->
```

## Specifying Rows and Columns

Optionally supply a `column` and/or a `row` argument to display other values from `data`. 

<Alert status=info>

**Row Index**

`row` is zero-indexed, so `row=0` displays the first row.

</Alert>

```markdown
<!-- Show the **7th row** from column_name -->

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

Override errors with the optional `placeholder` argument. This is useful for drafting reports _before_ writing your queries.

```markdown
<Value placeholder="Report Date"/>
```

![value-placeholder](/img/value-placeholder.png)

## Formatting Values
Evidence supports a variety of formats - see [value formatting](/core-concepts/formatting) and the `fmt` prop below for more info.

## Options

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    options="query name"
    required
/>
<PropListing
    name=column
    description="Column to pull values from"
    options="column name"
    defaultValue="First column"
/>
<PropListing
    name=row
    description="Row number to display. 0 is the first row."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=placeholder
    description="Text to display in place of an error"
    options="string"
/>
<PropListing
    name=fmt
    description="Format to use for the value (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>
