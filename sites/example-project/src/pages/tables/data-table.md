# Data Table

```fda_recalls
SELECT date_trunc(recall_initiation_date, year) as year, 
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year
```

```census
select median_rent as median_rent_usd, income_per_capita as income_per_capita_usd
from `bigquery-public-data.census_bureau_acs.state_2017_1yr`
```

<DataTable data={data.fda_recalls}/>
<DataTable data={data.census}/>

## Rows Property
### rows=40
<DataTable data={data.census} rows=40/>


