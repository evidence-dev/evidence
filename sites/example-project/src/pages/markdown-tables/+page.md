```fda_recalls
SELECT date_trunc(recall_initiation_date, year) as year,
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year
```

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?
<DataTable data={fda_recalls}/>
Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

| Column One | Column Two | Column Three |
| :--------: | :--------: | :----------: |
|    100     |    100     |    1,004     |
|    2134    |    140     |    1,130     |

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?
