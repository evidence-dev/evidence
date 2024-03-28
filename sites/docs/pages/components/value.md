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

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>
        <th>Options</th>
        <th>Default</th>	
    </tr>
    <tr>	
        <td>data</td>	
        <td>Query name, wrapped in curly braces</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>query name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>column</td>	
        <td>Column to pull values from</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>First column</td>
    </tr>
    <tr>	
        <td>row</td>	
        <td>Row number to display. 0 is the first row.</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>		
        <td class='tcenter'>0</td>
    </tr>
    <tr>	
        <td>placeholder</td>	
        <td>Text to display in place of an error</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>fmt</td>	
        <td>Format to use for the value (<a href='/core-concepts/formatting'>see available formats</a>)</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>
