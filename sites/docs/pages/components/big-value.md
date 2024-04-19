---
title: Big Value
sidebar_position: 1
---

`<BigValue />` displays a large value, and can be configured to include a comparison and a sparkline.

## Example

```markdown
<BigValue 
data={orders_with_comparisons} 
value=sales_usd0k
sparkline=month
comparison=sales_change_pct0
comparisonTitle="vs. Last Month"
/>
```

![bigvalue](/img/bigvalue-default.png)

## Multiple cards

Multiple cards will align themselves into a row.

![bigvalue](/img/bigvalue-multiple.png)


## Non-Delta Comparisons

```html
<BigValue 
data={orders_with_comparisons}
value=sales_usd0k
title="Category Sales"
comparison=sales_change_pct0
comparisonTitle="of Total"
comparisonDelta=false
/>
```

![bigvalue](/img/bigvalue-non-delta.png)


## Options

### Data

<PropListing
    name="data"
    required
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing
    name="value"
    required
    options="column name"
>

Column to pull the main value from.

</PropListing>
<PropListing
    name="title"
    options="string"
    defaultValue="Title of the value column."
>

Title of the card.

</PropListing>
<PropListing
    name="minWidth"
    options="% or px value"
    defaultValue="18%"
>

Overrides min-width of component

</PropListing>
<PropListing
    name="maxWidth"
    options="% or px value"
>

Adds a max-width to the component

</PropListing>
<PropListing
    name="fmt"
    options="Excel-style format | built-in format | custom format"
>

Sets format for the value ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="emptySet"
    options={['error', 'warn', 'pass']}
    defaultValue="error"
>

Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.

</PropListing>
<PropListing
    name="emptyMessage"
    options="string"
    defaultValue="No records"
>

Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>

### Comparison Options

<PropListing
    name="comparison"
    options="column name"
>

Column to pull the comparison value from.

</PropListing>
<PropListing
    name="comparisonTitle"
    options="string"
    defaultValue="Title of the comparison column."
>

Text to the right of the comparison.

</PropListing>
<PropListing
    name="comparisonDelta"
    options={['true', 'false']}
    defaultValue=true
>

Whether to display delta symbol and color

</PropListing>
<PropListing
    name="downIsGood"
    options={['true', 'false']}
    defaultValue=false
>

If present, negative comparison values appear in green, and positive values appear in red.

</PropListing>
<PropListing
    name="neutralMin"
    options="number"
    defaultValue=0
>

Sets the bottom of the range for 'neutral' values - neutral values appear in grey rather than red or green

</PropListing>
<PropListing
    name="neutralMax"
    options="number"
    defaultValue=0
>

Sets the top of the range for 'neutral' values - neutral values appear in grey rather than red or green

</PropListing>
<PropListing
    name="comparisonFmt"
    options="Excel-style format | built-in format | custom format"
>

Sets format for the comparison ([see available formats](/core-concepts/formatting))

</PropListing>

### Sparkline

<PropListing
    name="sparkline"
    options="column name"
>

Column to pull the date from to create the sparkline.

</PropListing>
<PropListing
    name="sparklineType"
    options={['line', 'area', 'bar']}
    defaultValue="line"
>

Chart type for sparkline

</PropListing>
<PropListing
    name="sparklineValueFmt"
    options="format code"
    defaultValue="same as fmt if supplied"
>

Formatting for tooltip values

</PropListing>
<PropListing
    name="sparklineDateFmt"
    options="format code"
    defaultValue="YYYY-MM-DD"
>

Formatting for tooltip dates

</PropListing>
<PropListing
    name="sparklineColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color of visualization

</PropListing>
<PropListing
    name="sparklineYScale"
    options={['true', 'false']}
    defaultValue=false
>

Whether to truncate the y-axis of the chart to enhance visibility

</PropListing>
<PropListing
    name="connectGroup"
    options="string"
>

Group name to connect this sparkline to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>