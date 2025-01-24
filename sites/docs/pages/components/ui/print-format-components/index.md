---
title: Print Format Components
description: Format your report content for PDF export or printing.
sidebar_position: 1
---

These components can be used to format your report content for PDF export or printing.

## LineBreak
Inserts a line break on the page (in the UI as well as on print).

This can be helpful when working with many input components (filters, dropdowns, etc.)

```html
Text on original line <LineBreak/> Text on new line
```

### Options

<PropListing
    name="lines"
    options="number"
    defaultValue="1"
>

Number of line breaks to insert

</PropListing>

## PageBreak
On print, inserts a page break - pushing the next content onto the start of a new page.

```html
The purple line chart in this section will print on a new page.

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
/>

<PageBreak/>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    lineColor=purple
/>

```

## PrintGroup
- Combines content to be printed on the same page if possible
- Offers a `hidden` prop. If `true`, the content within the PrintGroup will not be printed

```html
<PrintGroup>

    The 2 heatmaps below will be printed on the same page if possible

    <Heatmap data={item_channel} x=channel y=item value=orders/>
    <Heatmap data={item_channel} x=channel y=item value=orders/>
</PrintGroup>
```

### `hidden=true`

```html
The purple line chart will be hidden on print

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
/>

<PrintGroup hidden=true>
    <LineChart 
        data={orders_by_month} 
        x=month
        y=sales_usd0k 
        lineColor=purple
    />
</PrintGroup>
```

### Options

<PropListing
    name="hidden"
    options={['true', 'false']}
    defaultValue='false'
>

If true, the content within the PrintGroup will not be printed

</PropListing>