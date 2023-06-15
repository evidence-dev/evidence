---
title: Area Chart
sources:
  - orders_by_category: orders_by_category.sql
---

## Area

<AreaChart
data={orders_by_category.filter(d => d.category === "Sinister Toys")}
x=month
/>

## Area with Custom Line Color

<AreaChart
data={orders_by_category.filter(d => d.category === "Sinister Toys")}
x=month
lineColor=red
/>

## Stacked Area

<AreaChart 
    data={orders_by_category} 
    x=month 
    y=sales_usd0k 
    series=category
/>

## 100% Stacked Area

<AreaChart 
    data={orders_by_category} 
    x=month 
    y=sales_usd0k 
    series=category
    type=stacked100
/>

## Stacked Area with Custom Height

<AreaChart 
    data={orders_by_category} 
    x=month 
    y=sales_usd0k 
    series=category
    chartAreaHeight=380
/>
