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
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing
    name="value"
    description="Column to pull the main value from."
    required=true
    options="column name"
/>
<PropListing
    name="comparison"
    description="Column to pull the comparison value from."
    options="column name"
/>
<PropListing
    name="sparkline"
    description="Column to pull the date from to create the sparkline."
    options="column name"
/>
<PropListing
    name="title"
    description="Title of the card."
    options="string"
    defaultValue="Title of the value column."
/>
<PropListing
    name="comparisonTitle"
    description="Text to the right of the comparison."
    options="string"
    defaultValue="Title of the comparison column."
/>
<PropListing
    name="comparisonDelta"
    description="Whether to display delta symbol and color"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name="downIsGood"
    description="If present, negative comparison values appear in green, and positive values appear in red."
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name="minWidth"
    description="Overrides min-width of component"
    options="% or px value"
    defaultValue="18%"
/>
<PropListing
    name="maxWidth"
    description="Adds a max-width to the component"
    options="% or px value"
/>
<PropListing
    name="fmt"
    description="Sets format for the value (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name="comparisonFmt"
    description="Sets format for the comparison (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name="emptySet"
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name="emptyMessage"
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>


### Sparkline

<PropListing
    name="sparklineType"
    description="Chart type for sparkline"
    options={['line', 'area', 'bar']}
    defaultValue="line"
/>
<PropListing
    name="sparklineValueFmt"
    description="Formatting for tooltip values"
    options="format code"
    defaultValue="same as fmt if supplied"
/>
<PropListing
    name="sparklineDateFmt"
    description="Formatting for tooltip dates"
    options="format code"
    defaultValue="YYYY-MM-DD"
/>
<PropListing
    name="sparklineColor"
    description="Color of visualization"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name="sparklineYScale"
    description="Whether to truncate the y-axis of the chart to enhance visibility"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name="connectGroup"
    description="Group name to connect this sparkline to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
    options="string"
/>
