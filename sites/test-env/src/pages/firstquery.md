# Write your first query

The panel below is how SQL queries appear in Evidence.

When you are in development mode, queries are shown by default. In production, queries are hidden by default.

In either case, you (or your audience) can hide or show queries using the button up to the right.

```my_first_query

select
    101 as my_first_metric,
    200 as my_second_metric

```

{#if data.my_first_query[0] }

## Nice Job

Now that you have connected your data warehouse, head on over to the [docs](https://docs.evidence.dev) to see more of what evidence can do.

This section of the report only becomes visible once there is a row of data in my_first_query. You can use conditionals to keep your reports focused while still covering a wide variety of situations.

{:else }

The query won't be able run until you connect your data warehouse.

Visit <a href="https://docs.evidence.dev/getting-started/connect-data-warehouse" target="_blank">our docs</a> to learn how to connect to your data warehouse - it only takes a few minutes:

* <a href="https://docs.evidence.dev/getting-started/connect-data-warehouse#bigquery" target="_blank">Connect BigQuery</a>
* <a href="https://docs.evidence.dev/getting-started/connect-data-warehouse#snowflake" target="_blank">Connect Snowflake</a>
* <a href="https://docs.evidence.dev/getting-started/connect-data-warehouse#postgresql" target="_blank">Connect PostgreSQL</a>


{/if}
