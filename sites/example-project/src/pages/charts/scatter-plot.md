<script>
let regions = [
    {region: 'West', score_a: 59, score_b: 51},
    {region: 'West', score_a: 70, score_b: 43},
    {region: 'West', score_a: 72, score_b: 38},
    {region: 'West', score_a: 66, score_b: 34},
    {region: 'West', score_a: 59, score_b: 48},
    {region: 'West', score_a: 66, score_b: 34},
    {region: 'West', score_a: 62, score_b: 30},
    {region: 'West', score_a: 58, score_b: 32},
    {region: 'West', score_a: 51, score_b: 35},
    {region: 'West', score_a: 51, score_b: 52},
    {region: 'West', score_a: 59, score_b: 35},
    {region: 'West', score_a: 47, score_b: 37},
    {region: 'West', score_a: 54, score_b: 44},
    {region: 'West', score_a: 46, score_b: 48},
    {region: 'East', score_a: 47, score_b: 37},
    {region: 'East', score_a: 67, score_b: 48},
    {region: 'East', score_a: 81, score_b: 71},
    {region: 'East', score_a: 86, score_b: 54},
    {region: 'East', score_a: 76, score_b: 68},
    {region: 'East', score_a: 65, score_b: 67},
    {region: 'East', score_a: 81, score_b: 50},
    {region: 'East', score_a: 59, score_b: 77},
    {region: 'East', score_a: 64, score_b: 57},
    {region: 'East', score_a: 55, score_b: 62},
    {region: 'East', score_a: 78, score_b: 47},
    {region: 'East', score_a: 77, score_b: 59},
    {region: 'East', score_a: 67, score_b: 43},
    {region: 'East', score_a: 60, score_b: 45},
    {region: 'East', score_a: 57, score_b: 81},
    {region: 'East', score_a: 86, score_b: 67},
    {region: 'South', score_a: 112, score_b: 82},
    {region: 'South', score_a: 80, score_b: 83},
    {region: 'South', score_a: 75, score_b: 85},
    {region: 'South', score_a: 93, score_b: 55},
    {region: 'South', score_a: 99, score_b: 81},
    {region: 'South', score_a: 81, score_b: 53},
    {region: 'South', score_a: 113, score_b: 86},
    {region: 'South', score_a: 98, score_b: 103},
    {region: 'South', score_a: 84, score_b: 83},
    {region: 'South', score_a: 91, score_b: 70},
    {region: 'South', score_a: 120, score_b: 67},
    {region: 'South', score_a: 75, score_b: 53},
    {region: 'South', score_a: 97, score_b: 96},
    {region: 'South', score_a: 99, score_b: 74},
    {region: 'South', score_a: 83, score_b: 73}
]
</script>

```census
select median_rent as median_rent_usd, income_per_capita as income_per_capita_usd
from `bigquery-public-data.census_bureau_acs.state_2017_1yr`
```

## Scatter Plot
<ScatterPlot 
    data={census} 
    y=median_rent_usd 
    x=income_per_capita_usd 
    yAxisTitle="Median Rent" 
    xAxisTitle="Income Per Capita" 
    sort=false
/>

## Multi-Series Scatter Plot
<ScatterPlot data={regions} x=score_a y=score_b series=region xAxisTitle=true yAxisTitle=true/>
