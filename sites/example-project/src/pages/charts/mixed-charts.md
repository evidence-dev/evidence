```fda_recalls
SELECT date_trunc(recall_initiation_date, year) as year, 
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year
```

## Composable Charts
<Chart data={fda_recalls} x=year>
    <Bar y=voluntary_recalls/>
    <Line y=fda_recalls name="FDA Recalls"/>
</Chart>
