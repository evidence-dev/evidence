---
title: Grid
sidebar_position: 1
queries:
  - orders_by_category: orders_by_category.sql
  - orders_by_category_2021: orders_by_category_2021.sql
  - orders_by_item: orders_by_item.sql
  - items_all_time: orders_by_item_all_time.sql
  - marketing_spend: marketing_spend.sql
---

## Bar

<Grid cols=3>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
</Grid>

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?
Some text

<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?
<Grid cols=2 gapSize=lg>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
  </Grid>

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?