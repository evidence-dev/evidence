# Excel Export QA

Tables covering every table option that changes how a table looks, for checking the Excel export.

## Pivot with totals, shading and frozen column

{% table
    data="demo.daily_orders"
    title="Sales by Category and Year"
    subtitle="All channels · pivoted by year"
    info="Sales across every channel"
    row_shading=true
    freeze_columns=1
%}
{% dimension value="category" /%}
{% pivot value="date" date_grain="year" /%}
{% measure value="sum(total_sales)" fmt="usd" title="Sales" /%}
{% /table %}

## Two dimensions with subtotals, bars and red negatives

{% table
    data="demo.order_details"
    title="Units by Category and Item"
    where="category in ('Groceries', 'Electronics')"
%}
{% dimension value="category" /%}
{% dimension value="item_name" title="Item" /%}
{% measure value="sum(quantity)" title="Units" fmt="num0" viz="bar" /%}
{% measure value="sum(quantity) - 300000 as vs_target" title="Vs Target" fmt="num0" viz="bar" red_negatives=true /%}
{% measure value="sum(quantity * unit_price)" title="Revenue" fmt="usd1k" /%}
{% /table %}

## Column groups

{% table
    data="demo.daily_orders"
    title="Grouped Columns"
%}
{% dimension value="category" /%}
{% measure value="sum(total_sales)" title="Total" fmt="usd0k" column_group="Sales" /%}
{% measure value="avg(total_sales)" title="Average" fmt="usd2" column_group="Sales" /%}
{% measure value="sum(transactions)" title="Transactions" fmt="num0" column_group="Volume" /%}
{% measure value="avg(avg_transaction_value)" title="Avg Ticket" fmt="usd2" column_group="Volume" info="Average transaction value" /%}
{% measure value="sum(total_sales)" title="Trend" viz="sparkline" sparkline_options={ x="date" type="area" date_grain="month" } /%}
{% /table %}

## Color scales and conditional colors

{% table
    data="demo.daily_orders"
    title="Color Viz"
    row_conditional_colors="case when category = 'Home' then '#fef9c3' else null end"
%}
{% dimension value="category" conditional_colors="case when sum(total_sales) > 1500000 then '#dcfce7' else null end" /%}
{% measure value="sum(total_sales)" title="Default Scale" fmt="usd1m" viz="color" /%}
{% measure value="sum(total_sales) - 20000000 as diverging" title="Diverging" fmt="usd0k" viz="color" color_options={ color_scale=["#c0392b","#f4f4f4","#27ae60"] midpoint=0 } /%}
{% measure value="sum(transactions)" title="Conditional" fmt="num0" viz="color" color_options={ conditional_colors="case when sum(transactions) > 8000 then '#1e40af' else '#fde68a' end" } /%}
{% /table %}

## Deltas and comparisons

{% table
    data="demo.daily_orders"
    title="Year over Year"
%}
{% dimension value="category" /%}
{% measure value="sum(total_sales)" title="Sales" fmt="usd1m" date_range={ range="2024-01-01 to 2024-12-31" date="date" } /%}
{% measure value="sum(total_sales)" title="YoY" date_range={ range="2024-01-01 to 2024-12-31" date="date" } comparison={ compare_vs="prior year" } viz="delta" /%}
{% measure value="sum(total_sales)" title="YoY (down is good)" date_range={ range="2024-01-01 to 2024-12-31" date="date" } comparison={ compare_vs="prior year" display_type="abs" } viz="delta" delta_options={ down_is_good=true } /%}
{% /table %}

## Collapsible groups

{% table
    data="demo.order_details"
    title="Collapsible"
    collapsible=true
    row_shading=true
%}
{% dimension value="category" /%}
{% dimension value="item_name" title="Item" /%}
{% measure value="sum(quantity)" title="Units" fmt="num0" /%}
{% measure value="sum(quantity * unit_price)" title="Revenue" fmt="usd" /%}
{% /table %}

## Measures first, multiple measures

{% table
    data="demo.order_headers"
    title="Orders by Channel"
    measures_first=true
%}
{% dimension value="payment_method" title="Payment" /%}
{% pivot value="sales_channel" /%}
{% measure value="count(*)" title="Orders" fmt="num0" /%}
{% measure value="avg(hour)" title="Avg Hour" fmt="num1" /%}
{% /table %}

## Dates, links, wrapping, hidden labels and fit-to-data bars

{% table
    data="demo.daily_orders"
    title="Monthly Detail"
    wrap=true
    total_position="top"
    limit=24
%}
{% dimension value="date" date_grain="month" fmt="mmm yyyy" title="Month" /%}
{% dimension value="category" link="concat('https://www.google.com/search?q=', category)" /%}
{% measure value="sum(total_sales)" title="Sales with hidden labels" fmt="usd0k" viz="bar" bar_options={ hide_labels=true bar_color="#f59e0b" } /%}
{% measure value="avg(avg_transaction_value)" title="Avg Ticket (fit to data)" fmt="usd2" viz="bar" bar_options={ fit_to_data=true } /%}
{% measure value="sum(transactions)" title="Transactions" viz="sparkline" sparkline_options={ x="date" type="line" } /%}
{% /table %}

## Repeated values

{% table
    data="demo.order_details"
    title="Repeated Values"
    repeat_values=true
    where="category in ('Groceries', 'Sports')"
%}
{% dimension value="category" /%}
{% dimension value="item_name" title="Item" /%}
{% measure value="sum(quantity)" title="Units" fmt="num0" /%}
{% /table %}

## Plain table, no explicit columns

{% table data="demo.order_headers" limit=15 /%}
