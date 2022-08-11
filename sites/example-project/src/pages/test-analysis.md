<script>

    let areatest = [
        {x: 10, y:16, y2: 23, y3: 12},
        {x: 11, y:3, y2: 23, y3: 15},
        {x: 12, y:0, y2: 35, y3: 12},
        {x: 13, y:6, y2: 20, y3: 11},
        {x: 14, y:12, y2: 29, y3: 21},
        {x: 15, y:13, y2: 27, y3: 15},
        {x: 16, y:16, y2: 23, y3: 19},
        {x: 17, y:18, y2: 26, y3: 16}
    ]

    let bankData = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1}
]

let banksFilled = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'ATL', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'DAL', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'KC', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'CHI', established_date: '2015-01-01', banks: null},
    
    {fed_reserve_district: 'NY', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'SF', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'ATL', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'DAL', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'KC', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'CHI', established_date: '2016-01-01', banks: null},

    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'KC', established_date: '2017-01-01', banks: null},
    {fed_reserve_district: 'CHI', established_date: '2017-01-01', banks: null},
    {fed_reserve_district: 'NY', established_date: '2017-01-01', banks: null},

    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2018-01-01', banks: null},
    {fed_reserve_district: 'KC', established_date: '2018-01-01', banks: null},

    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'KC', established_date: '2019-01-01', banks: null},

    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2020-01-01', banks: null},
    {fed_reserve_district: 'DAL', established_date: '2020-01-01', banks: null},

    {fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2021-01-01', banks: null},
    {fed_reserve_district: 'NY', established_date: '2021-01-01', banks: null}
]

let banksFilledZero = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'ATL', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2015-01-01', banks: 0},
    
    {fed_reserve_district: 'NY', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'SF', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'ATL', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2016-01-01', banks: 0},

    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'KC', established_date: '2017-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2017-01-01', banks: 0},
    {fed_reserve_district: 'NY', established_date: '2017-01-01', banks: 0},

    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2018-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2018-01-01', banks: 0},

    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'KC', established_date: '2019-01-01', banks: 0},

    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2020-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2020-01-01', banks: 0},

    {fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2021-01-01', banks: 0},
    {fed_reserve_district: 'NY', established_date: '2021-01-01', banks: 0}
]

let series = ['San Francisco', 'Atlanta', 'New York', 'Washington', 'Chicago', 'Kansas City', 'Dallas']

</script>

<Chart data={areatest} xAxisTitle="Packages Delivered">
    <Area y=y/>
</Chart>

# Test Analysis

```banks
select state_name, 
case
    when active = true then 'Active'
    when active = false then 'Inactive'
    else 'Inactive'
end as active, count(*) as banks 
from `bigquery-public-data.fdic_banks.institutions`
group by state_name, active
order by banks desc
```

<BarChart swapXY=true data={data.banks} x=state_name y=banks series=active/>

<!-- <DataTable data={data.banks}/> -->

```dates
select date_trunc(established_date, year) as established_date, count(*)  as banks 
from `bigquery-public-data.fdic_banks.institutions`
group by established_date
order by established_date asc
```

<AreaChart data={data.dates} line=false x=established_date y=banks title="Bank Creation by Year" subtitle="1900s saw significant increase in bank creation" yAxisTitle="banks created per year" xAxisTitle="Establishment Year"/>

```dates_state
select fed_reserve_district, date_trunc(established_date, year) as established_date, count(*) as banks 
from `bigquery-public-data.fdic_banks.institutions`
where established_date >= '1960-01-01'
and established_date <= '2005-01-01'
group by fed_reserve_district, established_date
```

<AreaChart data={data.dates_state} x=established_date y=banks series=fed_reserve_district/>

<Chart data={data.dates_state} x=established_date y=banks series=fed_reserve_district line={false} fillOpacity=1>

    <Scatter boundGapRight={['4%','4%']}/>
</Chart>

<AreaChart data={bankData} x=established_date y=banks series=fed_reserve_district/>

<AreaChart data={banksFilled} x=established_date y=banks series=fed_reserve_district/>

<AreaChart data={banksFilledZero} x=established_date y=banks series=fed_reserve_district />


```dates_num
select fed_reserve_district, extract( year from established_date) as established_date, count(*) as banks 
from `bigquery-public-data.fdic_banks.institutions`
group by fed_reserve_district, established_date
```


{#each series as series}

{series}

<AreaChart data={data.dates_state.filter(d => d.fed_reserve_district === series)} x=established_date missing=zero/>

{/each}
