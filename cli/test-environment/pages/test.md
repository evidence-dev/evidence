# Sales Analytics Dashboard

Welcome to the interactive sales analytics report. Use the filters below to explore the data.


## Filters

{% dropdown
    id="category_filter"
    data="demo_daily_orders"
    value_column="category"
    title="Category"
    initial_value="All"
/%}

{% button_group
    id="time_grain"
    title="Time Grain"
%}
    {% option value="month" label="Monthly" /%}
    {% option value="quarter" label="Quarterly" /%}
    {% option value="year" label="Yearly" /%}
{% /button_group %}


## Key Metrics

{% row %}
    {% big_value
        data="demo_daily_orders"
        value="sum(total_sales)"
        title="Total Sales"
        fmt="usd1m"
        filters=["category_filter"]
        sparkline={
            type="area"
            x="date"
        }
    /%}
    {% big_value
        data="demo_daily_orders"
        value="sum(transactions)"
        title="Total Transactions"
        fmt="num0"
        filters=["category_filter"]
        sparkline={
            type="bar"
            x="date"
        }
    /%}
    {% big_value
        data="demo_daily_orders"
        value="avg(avg_transaction_value)"
        title="Avg Transaction Value"
        fmt="usd2"
        filters=["category_filter"]
    /%}
{% /row %}


## Sales Trends

{% line_chart
    data="demo_daily_orders"
    x="date"
    y="sum(total_sales)"
    series="category"
    date_grain={{time_grain}}
    y_fmt="usd"
    title="Sales Over Time by Category"
    subtitle="Interactive: select a category above to filter"
    filters=["category_filter"]
/%}

{% row %}
    {% line_chart
        data="demo_daily_orders"
        x="date"
        y="sum(transactions)"
        date_grain={{time_grain}}
        y_fmt="num0"
        title="Transaction Volume"
        filters=["category_filter"]
    /%}
    {% line_chart
        data="demo_daily_orders"
        x="date"
        y="avg(avg_transaction_value)"
        date_grain={{time_grain}}
        y_fmt="usd2"
        title="Average Transaction Value"
        filters=["category_filter"]
    /%}
{% /row %}


## Seasonality Analysis

{% row %}
    {% line_chart
        data="demo_daily_orders"
        x="date"
        y="sum(total_sales)"
        y_fmt="usd"
        date_grain="day of week"
        title="Sales by Day of Week"
        filters=["category_filter"]
    /%}
    {% line_chart
        data="demo_daily_orders"
        x="date"
        y="sum(total_sales)"
        y_fmt="usd"
        date_grain="month of year"
        title="Seasonality (Month of Year)"
        filters=["category_filter"]
    /%}
{% /row %}


## Category Performance Table

{% table
    data="demo_daily_orders"
    filters=["category_filter"]
%}
    {% dimension
        value="category"
    /%}
    {% pivot
        value="date"
        date_grain="year"
    /%}
    {% measure
        value="sum(total_sales)"
        title="Total Sales"
        fmt="usd1m"
        viz="bar"
        bar_options={
            bar_color="#3b82f6"
        }
    /%}
    {% measure
        value="sum(transactions)"
        title="Transactions"
        fmt="num0"
        viz="color"
    /%}
    {% measure
        value="sum(total_sales) / sum(transactions) as avg_order"
        title="Avg Order Value"
        fmt="usd2"
    /%}
{% /table %}


## Detailed Performance with Sparklines

{% table
    data="demo_daily_orders"
    filters=["category_filter"]
%}
    {% dimension
        value="category"
    /%}
    {% measure
        value="sum(total_sales)"
        title="Total Sales"
        fmt="usd1m"
    /%}
    {% measure
        value="sum(total_sales)"
        title="Sales Trend"
        viz="sparkline"
        sparkline_options={
            x="date"
            type="area"
        }
    /%}
    {% measure
        value="sum(transactions)"
        title="Transactions"
        fmt="num0"
    /%}
    {% measure
        value="sum(transactions)"
        title="Transaction Trend"
        viz="sparkline"
        sparkline_options={
            x="date"
            type="bar"
        }
    /%}
{% /table %}


## Year-over-Year Comparison

{% table
    data="demo_daily_orders"
    filters=["category_filter"]
%}
    {% dimension
        value="category"
    /%}
    {% measure
        value="sum(total_sales)"
        title="Sales (Last 12 Months)"
        fmt="usd1m"
        date_range={
            range="last 12 months"
            date="date"
        }
        comparison={
            compare_vs="prior year"
        }
        viz="delta"
    /%}
    {% measure
        value="sum(transactions)"
        title="Transactions (Last 12 Months)"
        fmt="num0"
        date_range={
            range="last 12 months"
            date="date"
        }
        comparison={
            compare_vs="prior year"
        }
        viz="delta"
    /%}
{% /table %}


## Product Catalog

{% table
    data="demo_items"
%}
    {% dimension
        value="category"
    /%}
    {% dimension
        value="item_name"
        title="Product"
    /%}
    {% measure
        value="max(base_price)"
        title="Price"
        fmt="usd2"
        viz="bar"
        bar_options={
            bar_color="#10b981"
        }
    /%}
{% /table %}
