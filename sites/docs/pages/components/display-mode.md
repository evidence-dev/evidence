---
title: Display Mode
sidebar_position: 1
---
    
```orders_summary
select category, order_month as month, sum(sales) as sales_usd0k, count(1) as orders from needful_things.orders
where category like '${inputs.selected_button}'
group by all
LIMIT 1000
```

```orders_summary_all
select category, order_month as month, sum(sales) as sales_usd0k, count(1) as orders from needful_things.orders
group by all
LIMIT 1000
```

```total_sales
SELECT SUM(sales_usd0k) AS total_sales
FROM (
  SELECT category, order_month AS month, SUM(sales) AS sales_usd0k, COUNT(1) AS orders
  FROM needful_things.orders
  WHERE category LIKE '${inputs.selected_button}'
  GROUP BY ALL
)
```

```categories
select 
    category,
    upper(left(category,3)) as short_category
from needful_things.orders
group by category
```




<DisplayMode >
    <DisplayInputs>
        <Checkbox
            title="Hide Months 0" 
            name=hide_months_0 
        />
        <Slider
        title="Months" 
        name=months
        defaultValue=18
        />
        <ButtonGroup             
        name=selected_button
        value=category>
            <ButtonGroupItem valueLabel="Sinister Toys" value="Sinister Toys" default/>
            <ButtonGroupItem valueLabel="Odd Equipment" value="Odd Equipment" />
            <ButtonGroupItem valueLabel="Mysterious Apparel" value="Mysterious Apparel" />
            <ButtonGroupItem valueLabel="Cursed Sporting Goods" value="Cursed Sporting Goods" />
        </ButtonGroup>
    </DisplayInputs>
        <Tabs>
            <Tab label="First Tab">
            <DisplayComponents>
                <DataTable data={orders_summary} />
                <LineChart 
                    data={orders_summary}
                    x=month
                    y=sales_usd0k 
                    yAxisTitle="Sales per Month"
                />
                <BigValue 
                    data={total_sales} 
                    value=total_sales
                />
                <LineChart 
                    data={orders_summary_all}
                    x=month
                    y=sales_usd0k 
                    yAxisTitle="Sales per Month"
                    series=category
                />
             </DisplayComponents>
            </Tab>
            <Tab label="Second Tab">
            <DisplayComponents>
                <BigValue 
                    data={total_sales} 
                    value=total_sales
                />
                <LineChart 
                    data={orders_summary}
                    x=month
                    y=sales_usd0k 
                    yAxisTitle="Sales per Month"
                />
                <LineChart 
                    data={orders_summary_all}
                    x=month
                    y=sales_usd0k 
                    yAxisTitle="Sales per Month"
                    series=category
                />
                <DataTable data={orders_summary} />
             </DisplayComponents>
            </Tab>
        </Tabs>
</DisplayMode >