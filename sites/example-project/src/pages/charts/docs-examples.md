```census
select median_rent as median_rent_usd, income_per_capita as income_per_capita_usd
from `bigquery-public-data.census_bureau_acs.state_2017_1yr`
```

```fda_recalls
SELECT date_trunc(recall_initiation_date, year) as year, 
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year
```

```fda_recalls_class
SELECT date_trunc(recall_initiation_date, year) as year, classification, 
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year, classification
```


```complaints_by_day_dept
    select 
        owning_department as dept,
        date_trunc(created_date, day) as date,
        count(*) as complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    where owning_department = "Transportation"
    group by 1,2 
    order by 3 desc
```

```simpler_bar_unordered
select "North" as country, 87 as value, 1994 as year
union all
select "North" as country, 83 as value, 1991 as year
union all
select "North" as country, 95 as value, 1992 as year
union all
select "North" as country, 82 as value, 1993 as year
union all
select "North" as country, 60 as value, 1990 as year
union all
select "North" as country, 103 as value, 1995 as year
union all
select "North" as country, 111 as value, 1996 as year
union all
select "Southwest" as country, 41 as value, 1990 as year
union all
select "Southwest" as country, 47 as value, 1991 as year
union all
select "Southwest" as country, 125 as value, 1996 as year
union all
select "Southwest" as country, 65 as value, 1994 as year
union all
select "Southwest" as country, 80 as value, 1992 as year
union all
select "Southwest" as country, 90 as value, 1995 as year
union all
select "Southwest" as country, 70 as value, 1993 as year
union all
select "East" as country, 61 as value, 1990 as year
union all
select "East" as country, 63 as value, 1991 as year
union all
select "East" as country, 68 as value, 1992 as year
union all
select "East" as country, 73 as value, 1993 as year
union all
select "East" as country, 80 as value, 1994 as year
union all
select "East" as country, 83 as value, 1995 as year
union all
select "East" as country, 85 as value, 1996 as year
union all
select "South" as country, 30 as value, 1990 as year
union all
select "South" as country, 33 as value, 1991 as year
union all
select "South" as country, 40 as value, 1992 as year
union all
select "South" as country, 52 as value, 1993 as year
union all
select "South" as country, 65 as value, 1994 as year
union all
select "South" as country, 78 as value, 1995 as year
union all
select "South" as country, 101 as value, 1996 as year
```

```simpler_bar_usd
select "North" as country, 87 as value_usd, 1994 as year
union all
select "North" as country, 83 as value_usd, 1991 as year
union all
select "North" as country, 95 as value_usd, 1992 as year
union all
select "North" as country, 82 as value_usd, 1993 as year
union all
select "North" as country, 60 as value_usd, 1990 as year
union all
select "North" as country, 103 as value_usd, 1995 as year
union all
select "North" as country, 111 as value_usd, 1996 as year
union all
select "Southwest" as country, 41 as value_usd, 1990 as year
union all
select "Southwest" as country, 47 as value_usd, 1991 as year
union all
select "Southwest" as country, 125 as value_usd, 1996 as year
union all
select "Southwest" as country, 65 as value_usd, 1994 as year
union all
select "Southwest" as country, 80 as value_usd, 1992 as year
union all
select "Southwest" as country, 90 as value_usd, 1995 as year
union all
select "Southwest" as country, 70 as value_usd, 1993 as year
union all
select "East" as country, 61 as value_usd, 1990 as year
union all
select "East" as country, 63 as value_usd, 1991 as year
union all
select "East" as country, 68 as value_usd, 1992 as year
union all
select "East" as country, 73 as value_usd, 1993 as year
union all
select "East" as country, 80 as value_usd, 1994 as year
union all
select "East" as country, 83 as value_usd, 1995 as year
union all
select "East" as country, 85 as value_usd, 1996 as year
union all
select "South" as country, 30 as value_usd, 1990 as year
union all
select "South" as country, 33 as value_usd, 1991 as year
union all
select "South" as country, 40 as value_usd, 1992 as year
union all
select "South" as country, 52 as value_usd, 1993 as year
union all
select "South" as country, 65 as value_usd, 1994 as year
union all
select "South" as country, 78 as value_usd, 1995 as year
union all
select "South" as country, 101 as value_usd, 1996 as year
```

```daily_complaints
    select 
        extract(date from created_date) as date, 
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1 
    order by 1 desc
    limit 150
```

```daily_volume_yoy
with daily_vol as (
        select 
        extract(year from created_date) as year,
        extract(dayofyear from created_date) as day_of_year,
        count(*) as vol
    from `bigquery-public-data.austin_311.311_service_requests`
    where extract(year from created_date) >= extract(year from current_date()) - 2 
    group by 1,2)

select 
    *, 
    sum(vol) over(partition by year order by day_of_year) as cum_vol
from daily_vol

```

```dates_state
select fed_reserve_district, date_trunc(established_date, year) as established_date, count(*) as banks 
from `bigquery-public-data.fdic_banks.institutions`
where established_date >= '1960-01-01'
and established_date <= '2005-01-01'
group by fed_reserve_district, established_date
```

```simple_bar
select "North" as country, -105 as value
union all
select "Northwest" as country, 101 as value
union all
select "South" as country, 113 as value
union all
select "Southeast" as country, -78 as value
union all
select "East" as country, 112 as value
union all
select "West" as country, 103 as value
union all
select "Southwest" as country, 110 as value
```

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

let region_bubble = [
    {region: 'West', score_a: 63, score_b: 51, size: 55},
    {region: 'West', score_a: 61, score_b: 52, size: 8},
    {region: 'West', score_a: 69, score_b: 35, size: 12},
    {region: 'West', score_a: 50, score_b: 39, size: 28},
    {region: 'West', score_a: 58, score_b: 49, size: 65},
    {region: 'West', score_a: 59, score_b: 49, size: 95},
    {region: 'West', score_a: 50, score_b: 46, size: 31},
    {region: 'West', score_a: 72, score_b: 34, size: 6},
    {region: 'West', score_a: 69, score_b: 54, size: 55},
    {region: 'West', score_a: 46, score_b: 37, size: 78},
    {region: 'West', score_a: 58, score_b: 31, size: 16},
    {region: 'West', score_a: 50, score_b: 31, size: 33},
    {region: 'West', score_a: 71, score_b: 48, size: 64},
    {region: 'West', score_a: 61, score_b: 47, size: 89},
    {region: 'East', score_a: 45, score_b: 39, size: 26},
    {region: 'East', score_a: 68, score_b: 42, size: 66},
    {region: 'East', score_a: 69, score_b: 62, size: 30},
    {region: 'East', score_a: 59, score_b: 44, size: 23},
    {region: 'East', score_a: 86, score_b: 57, size: 20},
    {region: 'East', score_a: 90, score_b: 41, size: 43},
    {region: 'East', score_a: 66, score_b: 60, size: 25},
    {region: 'East', score_a: 70, score_b: 41, size: 2},
    {region: 'East', score_a: 59, score_b: 42, size: 71},
    {region: 'East', score_a: 64, score_b: 69, size: 84},
    {region: 'East', score_a: 85, score_b: 84, size: 73},
    {region: 'East', score_a: 77, score_b: 54, size: 91},
    {region: 'East', score_a: 74, score_b: 48, size: 52},
    {region: 'East', score_a: 88, score_b: 44, size: 21},
    {region: 'East', score_a: 84, score_b: 85, size: 17},
    {region: 'East', score_a: 78, score_b: 87, size: 99},
    {region: 'South', score_a: 120, score_b: 69, size: 1},
    {region: 'South', score_a: 106, score_b: 74, size: 13},
    {region: 'South', score_a: 117, score_b: 67, size: 68},
    {region: 'South', score_a: 89, score_b: 100, size: 36},
    {region: 'South', score_a: 77, score_b: 65, size: 36},
    {region: 'South', score_a: 100, score_b: 70, size: 58},
    {region: 'South', score_a: 76, score_b: 52, size: 27},
    {region: 'South', score_a: 111, score_b: 81, size: 49},
    {region: 'South', score_a: 92, score_b: 103, size: 22},
    {region: 'South', score_a: 105, score_b: 77, size: 71},
    {region: 'South', score_a: 75, score_b: 89, size: 50},
    {region: 'South', score_a: 104, score_b: 82, size: 25},
    {region: 'South', score_a: 109, score_b: 68, size: 85},
    {region: 'South', score_a: 102, score_b: 88, size: 62},
    {region: 'South', score_a: 82, score_b: 68, size: 3}
]

let smallb = [
    {x: 1, y: 10, size: 1},
    {x: 2, y: 20, size: 10},
    {x: 3, y: 30, size: 50},
    {x: 4, y: 40, size: 75},
    {x: 5, y: 50, size: 100}
]
</script>

## Composable Charts
<Chart data={data.fda_recalls} x=year>
    <Bar y=voluntary_recalls/>
    <Line y=fda_recalls name="FDA Recalls"/>
</Chart>

## Line
<LineChart data={data.daily_complaints} x='date' y='number_of_complaints' yAxisTitle="calls to Austin 311 per day" title="Line"/>
<LineChart 
    data={data.daily_complaints} 
    x=date 
    y=number_of_complaints 
    yAxisTitle="calls to Austin 311 per day"
/>

## Multi-Series Line
<LineChart data={data.daily_volume_yoy} x=day_of_year y=cum_vol series=year yAxisTitle="cumulative calls" xAxisTitle="day of year" title="Multi-Series Line"/>
<LineChart 
    data={data.daily_volume_yoy} 
    x=day_of_year 
    y=cum_vol 
    series=year 
    yAxisTitle="cumulative calls" 
    xAxisTitle="day of year"
/>

## Muliple y Column Line
<LineChart data={data.fda_recalls} x=year y={['voluntary_recalls', 'fda_recalls']}/>
<LineChart data={data.fda_recalls}/>


## Multiple y Column and Series Line
<LineChart data={data.fda_recalls_class} x=year series=classification y={['voluntary_recalls', 'fda_recalls']}/>
<LineChart data={data.fda_recalls_class} series=classification/>

## Area
<AreaChart data={data.dates_state.filter(d => d.fed_reserve_district === "San Francisco")} x=established_date missing=zero title="Area"/>
<AreaChart 
    data={data.dates_state.filter(d => d.fed_reserve_district === "San Francisco")} 
    x=established_date 
/>

## Stacked Area
<AreaChart data={data.dates_state} x=established_date y=banks series=fed_reserve_district title="Stacked Area"/>
<AreaChart 
    data={data.dates_state} 
    x=established_date 
    y=banks 
    series=fed_reserve_district
/>

## Bar
<BarChart data={data.simple_bar} x=country y=value xAxisTitle=Region title="Bar"/>
<BarChart 
    data={data.simple_bar} 
    x=country 
    y=value 
    xAxisTitle=Region
/>

## Stacked Bar
<BarChart data={data.simpler_bar_usd} x=year y=value_usd series=country title="Annual Sales 1990-1996" subtitle="Regional Breakdown" xAxisTitle="Fiscal Year" yAxisTitle="million "/>

<BarChart data={data.simpler_bar_unordered} x=year y=value series=country title="Stacked Bar"/>
<BarChart 
    data={data.simpler_bar_unordered} 
    x=year 
    y=value 
    series=country
/>

## Grouped Bar
<BarChart data={data.simpler_bar_unordered} x=year y=value series=country type=grouped title="Grouped Bar"/>
<BarChart 
    data={data.simpler_bar_unordered} 
    x=year 
    y=value 
    series=country 
    type=grouped
/>

## Horizontal Bar
<BarChart data={data.simple_bar} x=country y=value xAxisTitle=Country yAxisTitle=Value swapXY=true title="Year-to-Date Value by Region" subtitle="South region leading as of June 30/21"/>
<BarChart data={data.simple_bar} x=country y=value xAxisTitle=Country swapXY=true title="Horizontal Bar"/>
<BarChart 
    data={data.simple_bar}
    x=country 
    y=value 
    xAxisTitle=Country 
    swapXY=true
/>

## Horizontal Stacked Bar
<BarChart data={data.simpler_bar_unordered} swapXY=true x=year y=value series=country title="Horizontal Stacked Bar" xType=category sort=false/>
<BarChart 
    data={data.simpler_bar_unordered} 
    swapXY=true 
    x=year 
    y=value 
    series=country 
    xType=category 
    sort=false
/>

## Horizontal Grouped Bar
<BarChart data={data.simpler_bar_unordered} swapXY=true x=year y=value series=country type=grouped title="Horizontal Grouped Bar" xType=category/>
<BarChart 
    data={data.simpler_bar_unordered} 
    swapXY=true 
    x=year 
    y=value 
    series=country 
    type=grouped 
    xType=category
/>

## Scatter Plot
<ScatterPlot data={data.census} y=median_rent_usd x=income_per_capita_usd yAxisTitle="Median Rent" xAxisTitle="Income Per Capita" title="Scatter Plot" sort=false/>
<ScatterPlot 
    data={data.census} 
    y=median_rent_usd 
    x=income_per_capita_usd 
    yAxisTitle="Median Rent" 
    xAxisTitle="Income Per Capita" 
    sort=false
/>

## Multi-Series Scatter Plot
<ScatterPlot data={regions} x=score_a y=score_b series=region xAxisTitle=true yAxisTitle=true title="Multi-Series Scatter"/>
<ScatterPlot data={regions} x=score_a y=score_b series=region xAxisTitle=true yAxisTitle=true/>

## Bubble Chart
<BubbleChart data={smallb} x=x y=y size=size xAxisTitle=true yAxisTitle=true title="Bubble"/>
<BubbleChart data={smallb} x=x y=y size=size xAxisTitle=true yAxisTitle=true/>

## Multi-Series Bubble Chart
<BubbleChart data={region_bubble} x=score_a y=score_b size=size series=region xAxisTitle=true yAxisTitle=true title="Multi-Series Bubble"/>
<BubbleChart data={region_bubble} x=score_a y=score_b size=size series=region xAxisTitle=true yAxisTitle=true/>

## Histogram
<Histogram data={data.complaints_by_day_dept} x=complaints binCount=50 xAxisTitle="Daily Calls" title="Histogram"/>
<Histogram 
    data={data.complaints_by_day_dept} 
    x=complaints 
    xAxisTitle="Daily Calls"
/>

## Custom ECharts
<!-- <script>
const dataAll = [
  [
    [10.0, 8.04],
    [8.0, 6.95],
    [13.0, 7.58],
    [9.0, 8.81],
    [11.0, 8.33],
    [14.0, 9.96],
    [6.0, 7.24],
    [4.0, 4.26],
    [12.0, 10.84],
    [7.0, 4.82],
    [5.0, 5.68]
  ],
  [
    [10.0, 9.14],
    [8.0, 8.14],
    [13.0, 8.74],
    [9.0, 8.77],
    [11.0, 9.26],
    [14.0, 8.1],
    [6.0, 6.13],
    [4.0, 3.1],
    [12.0, 9.13],
    [7.0, 7.26],
    [5.0, 4.74]
  ],
  [
    [10.0, 7.46],
    [8.0, 6.77],
    [13.0, 12.74],
    [9.0, 7.11],
    [11.0, 7.81],
    [14.0, 8.84],
    [6.0, 6.08],
    [4.0, 5.39],
    [12.0, 8.15],
    [7.0, 6.42],
    [5.0, 5.73]
  ],
  [
    [8.0, 6.58],
    [8.0, 5.76],
    [8.0, 7.71],
    [8.0, 8.84],
    [8.0, 8.47],
    [8.0, 7.04],
    [8.0, 5.25],
    [19.0, 12.5],
    [8.0, 5.56],
    [8.0, 7.91],
    [8.0, 6.89]
  ]
];
const markLineOpt = {
  animation: false,
  label: {
    formatter: 'y = 0.5 * x + 3',
    align: 'right'
  },
  lineStyle: {
    type: 'solid'
  },
  tooltip: {
    formatter: 'y = 0.5 * x + 3'
  },
  data: [
    [
      {
        coord: [0, 3],
        symbol: 'none'
      },
      {
        coord: [20, 13],
        symbol: 'none'
      }
    ]
  ]
};
let options = {
  title: {
    text: "Anscombe's quartet",
    left: 'center',
    top: 0
  },
  grid: [
    { left: '7%', top: '7%', width: '38%', height: '38%' },
    { right: '7%', top: '7%', width: '38%', height: '38%' },
    { left: '7%', bottom: '7%', width: '38%', height: '38%' },
    { right: '7%', bottom: '7%', width: '38%', height: '38%' }
  ],
  tooltip: {
    formatter: 'Group {a}: ({c})'
  },
  xAxis: [
    { gridIndex: 0, min: 0, max: 20 },
    { gridIndex: 1, min: 0, max: 20 },
    { gridIndex: 2, min: 0, max: 20 },
    { gridIndex: 3, min: 0, max: 20 }
  ],
  yAxis: [
    { gridIndex: 0, min: 0, max: 15 },
    { gridIndex: 1, min: 0, max: 15 },
    { gridIndex: 2, min: 0, max: 15 },
    { gridIndex: 3, min: 0, max: 15 }
  ],
  toolbox: {
      show: true,
      feature: {
          saveAsImage: {
              show: true
          }
      }
  },
  series: [
    {
      name: 'I',
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: dataAll[0],
      markLine: markLineOpt
    },
    {
      name: 'II',
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: dataAll[1],
      markLine: markLineOpt
    },
    {
      name: 'III',
      type: 'scatter',
      xAxisIndex: 2,
      yAxisIndex: 2,
      data: dataAll[2],
      markLine: markLineOpt
    },
    {
      name: 'IV',
      type: 'scatter',
      xAxisIndex: 3,
      yAxisIndex: 3,
      data: dataAll[3],
      markLine: markLineOpt
    }
  ]
};
</script>

<ECharts config={options}/> -->