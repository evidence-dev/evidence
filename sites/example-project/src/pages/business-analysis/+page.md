---
title: Business Analysis Workflow
---

# Business Analysis Workflow

This page is a small, synthetic example of turning operational data into a decision-ready analysis. The data is intentionally fictional so the workflow can be reused without exposing private business data.

## 1. Define the metric

For this example, fulfillment rate is defined as completed orders divided by requested orders. The denominator is kept visible in the query so that the metric is auditable.

~~~sql daily_operations
with daily_operations as (
    select *
    from (
        values
            (date '2025-01-01', 'North', 'Normal', 100, 96, 28.0, 2.40),
            (date '2025-01-01', 'South', 'Rain', 120, 105, 36.0, 2.90),
            (date '2025-01-02', 'North', 'Normal', 110, 108, 27.0, 2.35),
            (date '2025-01-02', 'South', 'Rain', 130, 109, 39.0, 3.10),
            (date '2025-01-03', 'North', 'Storm', 115, 101, 42.0, 3.25),
            (date '2025-01-03', 'South', 'Normal', 125, 119, 30.0, 2.55)
    ) as t(
        service_day,
        city_group,
        weather,
        requested_orders,
        completed_orders,
        avg_delivery_minutes,
        cost_per_order
    )
)
select
    service_day,
    city_group,
    weather,
    requested_orders,
    completed_orders,
    completed_orders::double / nullif(requested_orders, 0) as fulfillment_rate,
    avg_delivery_minutes,
    cost_per_order
from daily_operations
order by service_day, city_group
~~~

## 2. Surface the decision metrics

~~~sql summary
select
    sum(requested_orders) as requested_orders,
    sum(completed_orders) as completed_orders,
    sum(completed_orders)::double / nullif(sum(requested_orders), 0) as fulfillment_rate,
    avg(avg_delivery_minutes) as avg_delivery_minutes,
    avg(cost_per_order) as avg_cost_per_order
from ${daily_operations}
~~~

<BigValue data={summary} value=fulfillment_rate title="Fulfillment rate" fmt=pct0 />
<BigValue data={summary} value=avg_delivery_minutes title="Average delivery time" />
<BigValue data={summary} value=avg_cost_per_order title="Average cost per order" fmt=usd />

## 3. Diagnose the structure

The summary is not enough to explain the result. The next cut separates city group and weather condition so that a recommendation can be traced back to an observable pattern.

~~~sql by_weather
select
    weather,
    sum(requested_orders) as requested_orders,
    sum(completed_orders) as completed_orders,
    sum(completed_orders)::double / nullif(sum(requested_orders), 0) as fulfillment_rate,
    avg(avg_delivery_minutes) as avg_delivery_minutes,
    avg(cost_per_order) as avg_cost_per_order
from ${daily_operations}
group by weather
order by fulfillment_rate
~~~

<DataTable data={by_weather} />

<BarChart
    data={by_weather}
    x=weather
    y=fulfillment_rate
    yAxisTitle="Fulfillment rate"
/>

## 4. State the conclusion with its boundary

In this synthetic example, the storm and rain rows show lower fulfillment and longer delivery times. That supports an operational question about weather-sensitive capacity and cost, but it does not prove causality or quantify a real-world intervention effect.

A production analysis should add a consistent baseline, a comparison design, data-quality checks, and a follow-up review before claiming impact.