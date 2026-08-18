# Order Analysis Report

An in-depth analysis of retail orders across channels, payment methods, and product categories.

## Filters

{% dropdown
    id="channel_filter"
    data="demo.order_headers"
    value_column="sales_channel"
    title="Sales Channel"
    initial_value="All"
/%}

{% dropdown
id="payment_filter"
data="demo.order_headers"
value_column="payment_method"
title="Payment Method"
initial_value="All"
/%}

{% button_group
    id="time_grain"
    title="Time Period"
%}
{% option value="month" label="Monthly" /%}
{% option value="quarter" label="Quarterly" /%}
{% option value="year" label="Yearly" /%}
{% /button_group %}

## Executive Summary

{% row %}
{% big_value
        data="demo.order_headers"
        value="count(*)"
        title="Total Orders"
        fmt="num0"
        filters=["channel_filter", "payment_filter"]
        sparkline={
            type="bar"
            x="date"
        }
    /%}
{% big_value
        data="demo.order_details"
        value="sum(quantity * unit_price)"
        title="Total Revenue"
        fmt="usd1m"
        filters=["channel_filter"]
        sparkline={
            type="area"
            x="date"
        }
    /%}
{% big_value
        data="demo.order_details"
        value="sum(quantity)"
        title="Items Sold"
        fmt="num0"
        filters=["channel_filter"]
    /%}
{% /row %}

## Sales Channel Performance

Understanding how customers prefer to shop helps optimize resource allocation and marketing spend.

{% row %}
{% line_chart
        data="demo.order_headers"
        x="date"
        y="count(*)"
        series="sales_channel"
        date_grain={{time_grain}}
        y_fmt="num0"
        title="Orders by Sales Channel Over Time"
        filters=["payment_filter"]
    /%}
{% /row %}

{% table
    data="demo.order_headers"
    filters=["payment_filter"]
%}
{% dimension
        value="sales_channel"
        title="Channel"
    /%}
{% measure
        value="count(*)"
        title="Total Orders"
        fmt="num0"
        viz="bar"
        bar_options={
            bar_color="#3b82f6"
        }
    /%}
{% measure
        value="count(distinct date)"
        title="Active Days"
        fmt="num0"
    /%}
{% measure
        value="count(*)"
        title="Order Trend"
        viz="sparkline"
        sparkline_options={
            x="date"
            type="area"
        }
    /%}
{% /table %}

## Payment Method Analysis

Tracking payment preferences reveals customer behavior patterns and helps identify friction points in checkout.

{% row %}
{% line_chart
        data="demo.order_headers"
        x="date"
        y="count(*)"
        series="payment_method"
        date_grain={{time_grain}}
        y_fmt="num0"
        title="Payment Method Trends"
        filters=["channel_filter"]
    /%}
{% /row %}

{% table
    data="demo.order_headers"
    filters=["channel_filter"]
%}
{% dimension
        value="payment_method"
        title="Payment Method"
    /%}
{% pivot
        value="sales_channel"
    /%}
{% measure
        value="count(*)"
        title="Orders"
        fmt="num0"
        viz="color"
    /%}
{% /table %}

## Product Performance

Analyzing product-level data reveals which items drive revenue and which categories have the highest margins.

{% table
    data="demo.order_details"
    filters=["channel_filter"]
%}
{% dimension
        value="category"
    /%}
{% dimension
        value="item_name"
        title="Product"
    /%}
{% measure
        value="max(unit_price)"
        title="Price"
        fmt="usd2"
        viz="bar"
        bar_options={
            bar_color="#10b981"
        }
    /%}
{% measure
        value="sum(quantity)"
        title="Units Sold"
        fmt="num0"
    /%}
{% measure
        value="sum(quantity * unit_price)"
        title="Revenue"
        fmt="usd1m"
        viz="color"
    /%}
{% /table %}

## Category Revenue Analysis

{% row %}
{% line_chart
        data="demo.order_details"
        x="date"
        y="sum(quantity * unit_price)"
        series="category"
        date_grain={{time_grain}}
        y_fmt="usd"
        title="Revenue by Category Over Time"
        filters=["channel_filter"]
    /%}
{% /row %}

{% table
    data="demo.order_details"
    filters=["channel_filter"]
%}
{% dimension
        value="category"
    /%}
{% measure
        value="sum(quantity * unit_price)"
        title="Total Revenue"
        fmt="usd1m"
        viz="bar"
        bar_options={
            bar_color="#8b5cf6"
        }
    /%}
{% measure
        value="sum(quantity)"
        title="Units Sold"
        fmt="num0"
    /%}
{% measure
        value="sum(quantity * unit_price) / sum(quantity) as avg_price"
        title="Avg Price"
        fmt="usd2"
    /%}
{% measure
        value="sum(quantity * unit_price)"
        title="Revenue Trend"
        viz="sparkline"
        sparkline_options={
            x="date"
            type="area"
        }
    /%}
{% /table %}

## Time-of-Day Analysis

Understanding when customers shop helps optimize staffing and marketing schedules.

{% line_chart
    data="demo.order_headers"
    x="hour"
    y="count(*)"
    series="sales_channel"
    y_fmt="num0"
    title="Orders by Hour of Day"
    filters=["channel_filter", "payment_filter"]
/%}

{% table
    data="demo.order_headers"
    filters=["channel_filter", "payment_filter"]
%}
{% dimension
        value="hour"
        title="Hour"
    /%}
{% measure
        value="count(*)"
        title="Total Orders"
        fmt="num0"
        viz="bar"
        bar_options={
            bar_color="#f59e0b"
        }
    /%}
{% /table %}

## Top Selling Products

{% table
    data="demo.order_details"
    filters=["channel_filter"]
%}
{% dimension
        value="item_name"
        title="Product"
    /%}
{% dimension
        value="category"
    /%}
{% measure
        value="sum(quantity)"
        title="Units Sold"
        fmt="num0"
        viz="bar"
        bar_options={
            bar_color="#ec4899"
        }
    /%}
{% measure
        value="sum(quantity * unit_price)"
        title="Revenue"
        fmt="usd1m"
    /%}
{% measure
        value="sum(quantity * unit_price) / sum(quantity) as avg_price"
        title="Avg Price"
        fmt="usd2"
    /%}
{% measure
        value="sum(quantity)"
        title="Sales Trend"
        viz="sparkline"
        sparkline_options={
            x="date"
            type="bar"
        }
    /%}
{% /table %}

## Year-over-Year Performance

{% table
    data="demo.order_details"
    filters=["channel_filter"]
%}
{% dimension
        value="category"
    /%}
{% measure
        value="sum(quantity * unit_price)"
        title="Revenue (L12M)"
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
        value="sum(quantity)"
        title="Units Sold (L12M)"
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
