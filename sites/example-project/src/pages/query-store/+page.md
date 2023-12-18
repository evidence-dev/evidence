```test_query
SELECT * FROM marketing_spend
```

<DataTable data={test_query}/>
<DataTable data={test_query.groupBy("marketing_channel").agg({ avg: ["spend"], sum: ["spend"]})}/>
<DataTable data={test_query.limit(0)}/>

<LineChart data={test_query}/>

{test_query.at(0)}

<BigValue title=".at()" data={test_query.at(0)} value=spend />