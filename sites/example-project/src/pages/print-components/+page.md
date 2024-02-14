---
title: Print Components
queries:
  - orders_by_month: orders_by_month.sql
  - orders_by_category: orders_by_category.sql
---

## LineBreak
Insert a `<LineBreak/>` anywhere in your markdown to move the next content onto a new line.

Some text <LineBreak/> some more text

## PageBreak
Insert a `<PageBreak/>` to cause the next content to move to the next page on print.

The purple line chart in this section will print on a new page.

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
    yFmt=eur
    xFmt='mmm d'
/>

<PageBreak/>

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
    yFmt=eur
    xFmt='mmm d'
    lineColor=purple
/>


```item_channel
select item, channel, count(1) as orders from orders
group by all
```

    ## PrintGroup

    Ensure that content is printed together on the same page for printing (or the minimum number of pages depending on the length of the content) using `<PrintGroup/>`

    Evidence will attempt to print the following 2 heatmaps on the same page.

    <PrintGroup>
        <Heatmap data={item_channel} x=channel y=item value=orders/>
        <Heatmap data={item_channel} x=channel y=item value=orders/>
    </PrintGroup>

## Print Group with Hidden Content

The purple line chart will be hidden on print

<LineChart 
    data={orders_by_month} 
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
    yFmt=eur
    xFmt='mmm d'
/>

<PrintGroup hidden=true>
    <LineChart 
        data={orders_by_month} 
        x=month
        y=sales_usd0k 
        yAxisTitle="Sales per Month"
        yFmt=eur
        xFmt='mmm d'
        lineColor=purple
    />
</PrintGroup>