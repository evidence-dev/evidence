---
title: Big Value
sidebar_position: 1
queries: 
- orders_with_comparisons.sql
---

Big Value displays a large value, and can be configured to include a comparison and a sparkline.

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=num_orders
        sparkline=month
        comparison=order_growth
        comparisonFmt=pct1
        comparisonTitle="vs. Last Month"
      />
    </div>

```markdown
<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  sparkline=month
  comparison=order_growth
  comparisonFmt=pct1
  comparisonTitle="vs. Last Month"
/>
```
</DocTab>

## Examples

### Default

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=num_orders
      />
    </div>

```markdown
<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
/>
```
</DocTab>

### Comparisons

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=num_orders
        comparison=order_growth
        comparisonFmt=pct1
        comparisonTitle="MoM"
      />
    </div>

```markdown
<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  comparison=order_growth
  comparisonFmt=pct1
  comparisonTitle="MoM"
/>
```
</DocTab>

### Multiple cards

Multiple cards will align themselves into a row.

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=sales
        fmt=usd0
        comparison=sales_growth
        comparisonFmt=pct1
        comparisonTitle="MoM"
      />
      <BigValue 
        data={orders_with_comparisons} 
        value=num_orders
        title="Orders"
        comparison=order_growth
        comparisonFmt=pct1
        comparisonTitle="MoM"
      />
      <BigValue 
        data={orders_with_comparisons} 
        value=aov
        title="Average Order Value"
        fmt=usd2
        comparison=aov_growth
        comparisonFmt=pct1
        comparisonTitle="MoM"
      />
    </div>

```markdown
<BigValue 
  data={orders_with_comparisons} 
  value=sales
  fmt=usd0
  comparison=sales_growth
  comparisonFmt=pct1
  comparisonTitle="MoM"
/>
<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  title="Orders"
  comparison=order_growth
  comparisonFmt=pct1
  comparisonTitle="MoM"
/>
<BigValue 
  data={orders_with_comparisons} 
  value=aov
  title="Average Order Value"
  fmt=usd2
  comparison=aov_growth
  comparisonFmt=pct1
  comparisonTitle="MoM"
/>
```
</DocTab>

### Linking to other pages

The link property makes the Value component clickable, allowing navigation to other pages.

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=num_orders
        sparkline=month
        comparison=order_growth
        comparisonFmt=pct1
        comparisonTitle="vs. Last Month"
        link='/components/data/big-value'
      />
    </div>

```html
<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  sparkline=month
  comparison=order_growth
  comparisonFmt=pct1
  comparisonTitle="vs. Last Month"
  link='/components/data/big-value'
/>
```
</DocTab>

### Non-Delta Comparisons

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=num_orders
        comparison=prev_month_orders
        comparisonTitle="Last Month"
        comparisonDelta=false
      />
    </div>

```html
<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  comparison=prev_month_orders
  comparisonTitle="Last Month"
  comparisonDelta=false
/>
```
</DocTab>

### Sparkline

<DocTab>
    <div slot='preview'>
      <BigValue 
        data={orders_with_comparisons} 
        value=sales
        sparkline=month
      />
    </div>

```html
<BigValue 
  data={orders_with_comparisons} 
  value=sales
  sparkline=month
/>
```
</DocTab>

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
    name="title"
    description="Title of the card."
    options="string"
    defaultValue="Title of the value column."
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

<PropListing name="link">

Used to navigate to other pages. Can be a full external link like `https://google.com` or an internal link like `/sales/performance`
</PropListing>

### Comparison Options

<PropListing
    name="comparison"
    description="Column to pull the comparison value from."
    options="column name"
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
    name="neutralMin"
    description="Sets the bottom of the range for 'neutral' values - neutral values appear in grey rather than red or green"
    options="number"
    defaultValue=0
/>
<PropListing
    name="neutralMax"
    description="Sets the top of the range for 'neutral' values - neutral values appear in grey rather than red or green"
    options="number"
    defaultValue=0
/>
<PropListing
    name="comparisonFmt"
    description="Sets format for the comparison (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>


### Sparkline

<PropListing
    name="sparkline"
    description="Column to pull the date from to create the sparkline."
    options="column name"
/>
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