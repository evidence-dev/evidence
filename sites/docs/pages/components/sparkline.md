---
title: Sparkline
sidebar_position: 1
---

```sql orders_by_month
select order_month as month, sum(sales) as sales_usd0k, count(1) as orders from needful_things.orders
group by all
```

```sql orders_by_category
select category, order_month as month, sum(sales) as sales_usd0k, count(1) as orders from needful_things.orders
group by all
```

<Sparkline 
    data={orders_by_month}
    dateCol=month
    valueCol=sales_usd0k 
    color=navy
/>

```markdown
<Sparkline 
    data={sales_by_date} 
    dateCol=date 
    valueCol=sales 
/>
```

## Examples

### Connected Sparkline

<Sparkline data={orders_by_month} dateCol=month valueCol=sales_usd0k type=bar  valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={orders_by_month} dateCol=month valueCol=sales_usd0k type=area color=maroon valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={orders_by_month} dateCol=month valueCol=sales_usd0k type=line color=purple valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>

```html
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=bar  valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=area color=maroon valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=line color=purple valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
```

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
    name="dateCol"
    required
    options="column name"
>

Categorical column to use for the x-axis

</PropListing>
<PropListing
    name="valueCol"
    required
    options="column name"
>

Numeric column to use for the y-axis

</PropListing>
<PropListing
    name="type"
    options={['line', 'area', 'bar']}
    defaultValue="line"
>

Chart type for sparkline

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

### Formatting & Styling

<PropListing
    name="color"
    options="CSS name | hexademical | RGB | HSL"
>

Color to use for the visualization. For area sparklines, choose the color for the line and the area color will be automatically appplied in a lighter shade.

</PropListing>
<PropListing
    name="valueFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="dateFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for date column ([see available formats](/core-concepts/formatting))

</PropListing>

### Axes

<PropListing
    name="yScale"
    options={['true', 'false']}
    defaultValue="false"
>

Whether to truncate the y-axis to enhance visibility

</PropListing>

### Sizing

<PropListing
    name="height"
    options="number"
    defaultValue="15"
>

Height of sparkline in pixels

</PropListing>
<PropListing
    name="width"
    options="number"
    defaultValue="50"
>

Width of sparkline in pixels

</PropListing>

### Interactivity

<PropListing
    name="interactive"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off tooltip behaviour on hover. If off, chart will be a staticly rendered SVG (better for page performance). If on, you will be able to see dates/values when hovering over the sparkline

</PropListing>
<PropListing
    name="connectGroup"
    options="string"
>

Group name to connect this sparkline to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>
