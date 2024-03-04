# Query Time exploration

This is a summary run against a large Snowflake warehouse

```sql qt
SELECT 
    queryname,
    rowcount,
    (querytime_ms / 1000 / 60) as query_time,
    (parquettime_ms / 1000 / 60) as parquet_time
FROM csv."query-times"
```


{#each qt as q}
    <BigValue data={[q]} value="query_time" title="{q.queryname} ({q.rowcount}) Query Time" />
    <BigValue data={[q]} value="parquet_time" title="{q.queryname} ({q.rowcount}) Parquet Time" />
{/each}


<Grid columns=2>

## Large Query

## Two Million Total Rows


This query maxes at 20 million rows

This query maxes at 1.9 million rows

<LineChart
    data={qt.where("queryname = 'large_query'")}
    x="rowcount"
    xAxisTitle="Result Row Count"
    yAxisTitle="Execution Time"
    y="query_time"
    yFmt='##0.00" minutes"'
    series="queryname"
    title="Query Execution Time (large_query)"
/>
<LineChart
    data={qt.where("queryname = 'two_million_total_rows'")}
    x="rowcount"
    xAxisTitle="Result Row Count"
    yAxisTitle="Execution Time"
    y="query_time"
    yFmt='##0.00" minutes"'
    series="queryname"
    title="Query Execution Time (two_million_total_rows)"
/>

<LineChart
    data={qt.where("queryname = 'large_query'")}
    x="rowcount"
    xAxisTitle="Result Row Count"
    yAxisTitle="Execution Time"
    y="parquet_time"
    yFmt='##0.00" minutes"'
    series="queryname"
    title="Parquet Execution Time (large_query)"
/>

<LineChart
    data={qt.where("queryname = 'two_million_total_rows'")}
    x="rowcount"
    xAxisTitle="Result Row Count"
    yAxisTitle="Execution Time"
    y="parquet_time"
    yFmt='##0.00" minutes"'
    series="queryname"
    title="Parquet Execution Time (two_million_total_rows)"
/>
</Grid>


<LineChart
    data={qt.where("rowcount < 10000000")}
    x="rowcount"
    xAxisTitle="Result Row Count"
    yAxisTitle="Execution Time"
    y="parquet_time"
    yFmt='##0.00" minutes"'
    series="queryname"
    title="Parquet Execution Time (Both Queries)"
/>
