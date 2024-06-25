# TZ
```sql tz
SELECT * FROM tz
```

<DataTable data={tz}>
  {#each tz.columns as col}
    <Column id={col.column_name} fmt="dddd mmmm d, yyyy H:MM:SS AM/PM" />

  {/each}
</DataTable>

<div class="grid grid-cols-3 text-xs">
  <span class="font-bold">Name</span>
  <span class="font-bold">JSON.stringify</span>
  <span class="font-bold">On page</span>
  {#each tz.columns as col}
    <span>{col.column_name}</span>
    <span>{JSON.stringify(tz[0][col.column_name])}</span>
    <span>{tz[0][col.column_name]}</span>
  {/each}
</div>


# RANDOM_METRICS
```sql random_metrics
SELECT * FROM random_metrics
```


<DataTable data={random_metrics} rows="all" compact>
  <Column id="daily1" title="Daily Formatted" fmt="dddd mmmm d, yyyy H:MM:SS AM/PM" />
  <Column id="daily2" title="Daily" />
  <Column id="avg_metric" />
</DataTable>

<div class="grid grid-cols-3 text-xs">
  <span class="font-bold">Name</span>
  <span class="font-bold">JSON.stringify</span>
  <span class="font-bold">On page</span>
  {#each random_metrics.columns as col}
    <span>{col.column_name}</span>
    <span>{JSON.stringify(random_metrics[0][col.column_name])}</span>
    <span>{random_metrics[0][col.column_name]}</span>
  {/each}
</div>
