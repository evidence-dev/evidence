```mermaid
graph LR
  %% inputs
  merchant_id_select
  channel_select
  market_select
  measure_select
  dropdown_geo_select
  date_select

  %% queries
  merchant_industry_data([merchant_industry_data])
  channel_data([channel_data])
  market_select_data([market_select_data])
  metric_merchant_select_data([metric_merchant_select_data])
  merchant_geo_list_data_state([merchant_geo_list_data_state])
  merchant_geo_list_data_cbsa([merchant_geo_list_data_cbsa])
  merchant_geo_list_data([merchant_geo_list_data])
  market_share_sales_merchants_data([market_share_sales_merchants_data])
  metric_merchant_select_data([metric_merchant_select_data])
  merchant_state_data_test([merchant_state_data_test])
  merchant_cbsa_data_test([merchant_cbsa_data_test])
  us_mcc_growth_table_data([us_mcc_growth_table_data])
  consumer_spending_merchant_ts_data([consumer_spending_merchant_ts_data])
  date_range_data([date_range_data])

  %% charts
  linechart[[linechart]]
  areachart[[areachart]]


  %% Markdown Refs
  merchant_industry_data --> merchant_id_select
  channel_data --> channel_select
  market_select_data --> market_select
  metric_merchant_select_data --> measure_select

  date_range_data --> date_select


  conditional_one((conditional))
  market_select --> conditional_one
  merchant_geo_list_data_state -- == 'State' --> conditional_one
  merchant_geo_list_data_cbsa -- == 'CBSA' --> conditional_one
  conditional_one --> dropdown_geo_select

  market_share_sales_merchants_data --> linechart
  market_share_sales_merchants_data --> areachart
  measure_select --> linechart
  measure_select --> areachart

  %% Query Refs
  merchant_id_select --> consumer_spending_merchant_ts_data
  date_select --> consumer_spending_merchant_ts_data
  channel_select --> consumer_spending_merchant_ts_data
  dropdown_geo_select --> consumer_spending_merchant_ts_data

  channel_select -- Commented out Reference! --> us_mcc_growth_table_data

  merchant_id_select --> merchant_geo_list_data
  channel_select --> merchant_geo_list_data


  consumer_spending_merchant_ts_data --> merchant_state_data_test
  consumer_spending_merchant_ts_data --> merchant_cbsa_data_test

  consumer_spending_merchant_ts_data --> market_share_sales_merchants_data
  market_select --> market_share_sales_merchants_data

```

```sql categories
SELECT DISTINCT category from orders;
```

<Dropdown name="selected_category" data={categories} value=category defaultValue="Sinister Toys" />

```sql states
SELECT DISTINCT state FROM orders
WHERE category = '${inputs.selected_category.value}'
```

<Dropdown name="selected_state" data={states} value=state />

```sql local_orders
SELECT * FROM ORDERS

WHERE category = '${inputs.selected_category.value}'
  AND state = '${inputs.selected_state.value}'
```

<LineChart
  data={local_orders}
  x=order_month
  />

<!--
  Conditional
-->