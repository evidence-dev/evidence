```test_query
SELECT * FROM marketing_spend
```

{test_query instanceof QueryStore}

<DataTable data={test_query}/>
<DataTable data={test_query.groupBy("marketing_channel").agg({ avg: ["spend"], sum: ["spend"]})}/>
<DataTable data={test_query.limit(0)}/>