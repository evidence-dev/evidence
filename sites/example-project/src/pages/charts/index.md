# QuickCharts
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Histogram
<Histogram data={data.simpler_bar} x=value xTickMarks=true/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<Histogram data={data.mobility} x=retail/>
<Histogram data={data.census} x=median_rent_usd/>
<DataTable data={data.census}/>

## Bar Chart
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<BarChart data={data.simple_bar} x=country y=value/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<BarChart data={data.simple} x=x y=y/>

### Incorrect query syntax
<BarChart data=data.simple_bar x=country y=value/>


## Stacked Bar
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<BarChart swapXY=true data={data.simpler_bar_unordered} x=year y=value series=country/>

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<BarChart swapXY=true data={data.simpler_bar_unordered} x=year y=value series=country/>

<BarChart swapXY=true data={data.simpler_bar} x=year y=value series=country/>

## Column Chart
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<BarChart data={data.simple_bar} x=country y=value xAxisTitle=Country/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<BarChart data={data.simple} x=x y=y/>
<BarChart data={data.simple_string} x=x y=y/>

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Stacked Column
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<BarChart data={data.simpler_bar_unordered} x=year y=value series=country/>

## Line Chart
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Single Line
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<LineChart data={data.mobility} x=date y=retail yAxisTitle="% chg y/y"/>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

```select10
select * from orders

limit 10
```

```select10_broken
select * from orders
limit 10
```




```date_new
select '2020-01-01' as date, 10 as value
union all
select '2020-02-01' as date, 12 as value
union all
select '2020-03-01' as date, 5 as value
```
<LineChart data={data.date_new} x=date y=value yGridlines=false/>

### Multiple Line
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<LineChart data={data.simpler_bar} x=year y=value series=country/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

```big_values
select 10000 as x, 1500 as y
union all
select 20000 as x, 2500 as y
union all
select 30000 as x, 1200 as y
```

<LineChart data={data.big_values} x=x y=y/>

## Area Chart
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<AreaChart data={data.mobility} x=date y=retail yGridlines=false/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Scatter Plot
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<ScatterPlot data={data.census} y=median_rent_usd x=income_per_capita_usd yAxisTitle="Median Rent" xAxisTitle="Income Per Capita"/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Grouped Scatter Plot
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<ScatterPlot data={data.simple_scatter} x=x y=y series=category/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Bubble Chart
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<BubbleChart data={data.world_data} x=population y=life_expectancy size=gdp minSize=300/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Grouped Bubble Chart
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<BubbleChart data={data.simple_scatter} x=x y=y size=y series=category/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Table
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<DataTable data={data.simpler_bar} rowNumbers=false/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<DataTable data={data.simpler_bar} rows=20/>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
<DataTable data={data.mobility} rowNumbers=false/>
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.


```simplef
select 1 as x, 3 as y
union all
select 2 as x, 5 as y
```


```simple
select 1 as x, 3 as y
union all
select 2 as x, 5 as y
union all
select 3 as x, 8 as y
union all
select 4 as x, 7 as y
union all
select 5 as x, 6 as y
union all
select 6 as x, 5 as y
```

```simple_unordered
select 4 as x, 7 as y
union all
select 2 as x, 5 as y
union all
select 3 as x, 8 as y
union all
select 1 as x, 3 as y
union all
select 5 as x, 6 as y
union all
select 6 as x, 5 as y
```




```simple_scatter
select 1 as x, 3 as y, "A" as category
union all
select 2 as x, 5 as y, "A" as category
union all
select 3 as x, 8 as y, "B" as category
union all
select 4 as x, 7 as y, "B" as category
union all
select 5 as x, 6 as y, "C" as category
union all
select 6 as x, 5 as y, "C" as category
```

```simple_string
select "1" as x, 3 as y
union all
select "2" as x, 5 as y
union all
select "3" as x, 8 as y
union all
select "4" as x, 7 as y
union all
select "5" as x, 6 as y
union all
select "6" as x, 5 as y
```

```line_test
select 1990 as year, 33 as value
union all
select 1990 as year, 60 as value
```



```census
select median_rent as median_rent_usd, income_per_capita as income_per_capita_usd
from `bigquery-public-data.census_bureau_acs.state_2017_1yr`
```


```daily_complaints
    select 
        extract(date from created_date) as date, 
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1 
    order by 1 desc
    limit 365
```

```complaints_by_dept
    select 
        owning_department as dept,
        count(*) as number_of_complaints 
    from `bigquery-public-data.austin_311.311_service_requests` 
    group by 1 
    order by 2 desc
    limit 365
```

```mobility
select DATE(date) as date, retail_and_recreation_percent_change_from_baseline as retail
from `bigquery-public-data.covid19_google_mobility.mobility_report`
where country_region = "Canada"
and sub_region_2 = "Toronto Division"
order by date desc
```

```mobility_string
select CAST(DATE(date) as STRING) as date, retail_and_recreation_percent_change_from_baseline as retail
from `bigquery-public-data.covid19_google_mobility.mobility_report`
where country_region = "Canada"
and sub_region_2 = "Toronto Division"
order by date desc
```

```mobility2
select min(DATE(date)) as date
from `bigquery-public-data.covid19_google_mobility.mobility_report`
where country_region = "Canada"
and sub_region_2 = "Toronto Division"
```


```simple_data
select 1 as x, 3 as y, "A" as z
union all
select 2 as x, 7 as y, "A" as z
union all
select 4 as x, 10 as y, "B" as z
union all
select 5 as x, 11 as y, "A" as z
union all
select 6 as x, 13 as y, "B" as z
union all
select 7 as x, 8 as y, "A" as z
union all
select 8 as x, 6 as y, "B" as z
union all
select 9 as x, 14 as y, "A" as z

```


``` simpler_data
select 1 as x
union all
select 2 as x
union all
select 3 as x
union all
select 4 as x
union all
select 5 as x
```



``` world_data
select 110 as gdp, 175 as population, 75 as life_expectancy
union all
select 115 as gdp, 150 as population, 80 as life_expectancy
union all
select 120 as gdp, 200 as population, 90 as life_expectancy
union all
select 125 as gdp, 175 as population, 59 as life_expectancy
union all
select 112 as gdp, 220 as population, 65 as life_expectancy
union all
select 120 as gdp, 210 as population, 77 as life_expectancy
union all
select 123 as gdp, 200 as population, 88 as life_expectancy
union all
select 117 as gdp, 197 as population, 92 as life_expectancy
union all
select 113 as gdp, 155 as population, 79 as life_expectancy
union all
select 108 as gdp, 168 as population, 78 as life_expectancy
union all
select 109 as gdp, 214 as population, 81 as life_expectancy
union all
select 117 as gdp, 189 as population, 84 as life_expectancy
union all
select 122 as gdp, 169 as population, 85 as life_expectancy

```

```date_check
select "1990-01-01" as date, 100 as value
union all
select "1992-01-01" as date, 105 as value
union all
select "1994-01-01" as date, 111 as value
union all
select "1996-01-01" as date, 118 as value
union all
select "1998-01-01" as date, 121 as value
union all
select "2000-01-01" as date, 130 as value
union all
select "2002-01-01" as date, 144 as value
union all
select "2004-01-01" as date, 147 as value
union all
select "2006-01-01" as date, 155 as value
union all
select "2008-01-01" as date, 175 as value

```

```date_check_2
select "1990-01-01" as date, 100 as value
union all
select "1990-02-01" as date, 105 as value
union all
select "1990-03-01" as date, 111 as value
union all
select "1990-04-01" as date, 118 as value
union all
select "1990-05-01" as date, 121 as value
union all
select "1990-06-01" as date, 130 as value
union all
select "1990-07-01" as date, 144 as value
union all
select "1990-08-01" as date, 147 as value
union all
select "1990-09-01" as date, 155 as value
union all
select "1990-10-01" as date, 175 as value

```

```simple_bar
select "Canada" as country, -105 as value
union all
select "Japan" as country, 101 as value
union all
select "China" as country, 113 as value
union all
select "Mexico" as country, -78 as value
union all
select "UK" as country, 112 as value
union all
select "Zimbabwe" as country, 103 as value
union all
select "US" as country, 110 as value
```

```simpler_bar
select "Canada" as country, 60 as value, 1990 as year
union all
select "Canada" as country, 83 as value, 1991 as year
union all
select "Canada" as country, 95 as value, 1992 as year
union all
select "Canada" as country, 182 as value, 1993 as year
union all
select "Canada" as country, 87 as value, 1994 as year
union all
select "Canada" as country, 103 as value, 1995 as year
union all
select "Canada" as country, 111 as value, 1996 as year
union all
select "US" as country, 41 as value, 1990 as year
union all
select "US" as country, 47 as value, 1991 as year
union all
select "US" as country, 70 as value, 1992 as year
union all
select "US" as country, 65 as value, 1993 as year
union all
select "US" as country, 80 as value, 1994 as year
union all
select "US" as country, 90 as value, 1995 as year
union all
select "US" as country, 125 as value, 1996 as year
union all
select "UK" as country, 61 as value, 1990 as year
union all
select "UK" as country, 63 as value, 1991 as year
union all
select "UK" as country, 68 as value, 1992 as year
union all
select "UK" as country, 73 as value, 1993 as year
union all
select "UK" as country, 80 as value, 1994 as year
union all
select "UK" as country, 83 as value, 1995 as year
union all
select "UK" as country, 85 as value, 1996 as year
union all
select "China" as country, 30 as value, 1990 as year
union all
select "China" as country, 33 as value, 1991 as year
union all
select "China" as country, 40 as value, 1992 as year
union all
select "China" as country, 52 as value, 1993 as year
union all
select "China" as country, 65 as value, 1994 as year
union all
select "China" as country, 78 as value, 1995 as year
union all
select "China" as country, 101 as value, 1996 as year

```

```simpler_bar_unordered
select "Canada" as country, 87 as value, 1994 as year
union all
select "Canada" as country, 83 as value, 1991 as year
union all
select "Canada" as country, 95 as value, 1992 as year
union all
select "Canada" as country, 182 as value, 1993 as year
union all
select "Canada" as country, 60 as value, 1990 as year
union all
select "Canada" as country, 103 as value, 1995 as year
union all
select "Canada" as country, 111 as value, 1996 as year
union all
select "US" as country, 41 as value, 1990 as year
union all
select "US" as country, 47 as value, 1991 as year
union all
select "US" as country, 125 as value, 1996 as year
union all
select "US" as country, 65 as value, 1994 as year
union all
select "US" as country, 80 as value, 1992 as year
union all
select "US" as country, 90 as value, 1995 as year
union all
select "US" as country, 70 as value, 1993 as year
union all
select "UK" as country, 61 as value, 1990 as year
union all
select "UK" as country, 63 as value, 1991 as year
union all
select "UK" as country, 68 as value, 1992 as year
union all
select "UK" as country, 73 as value, 1993 as year
union all
select "UK" as country, 80 as value, 1994 as year
union all
select "UK" as country, 83 as value, 1995 as year
union all
select "UK" as country, 85 as value, 1996 as year
union all
select "China" as country, 30 as value, 1990 as year
union all
select "China" as country, 33 as value, 1991 as year
union all
select "China" as country, 40 as value, 1992 as year
union all
select "China" as country, 52 as value, 1993 as year
union all
select "China" as country, 65 as value, 1994 as year
union all
select "China" as country, 78 as value, 1995 as year
union all
select "China" as country, 101 as value, 1996 as year

```



```simpler_bar_2
select "Canada" as country, 60 as value, "1990-01-01" as year
union all
select "Canada" as country, 83 as value, "1991-01-01" as year
union all
select "Canada" as country, 95 as value, "1992-01-01" as year
union all
select "Canada" as country, 82 as value, "1993-01-01" as year
union all
select "Canada" as country, 87 as value, "1994-01-01" as year
union all
select "Canada" as country, 103 as value, "1995-01-01" as year
union all
select "Canada" as country, 111 as value, "1996-01-01" as year
union all
select "United States" as country, 41 as value, "1990-01-01" as year
union all
select "United States" as country, 47 as value, "1991-01-01" as year
union all
select "United States" as country, 70 as value, "1992-01-01" as year
union all
select "United States" as country, 65 as value, "1993-01-01" as year
union all
select "United States" as country, 80 as value, "1994-01-01" as year
union all
select "United States" as country, 90 as value, "1995-01-01" as year
union all
select "United States" as country, 125 as value, "1996-01-01" as year
union all
select "UK" as country, 54 as value, "1990-01-01" as year
union all
select "UK" as country, 63 as value, "1991-01-01" as year
union all
select "UK" as country, 68 as value, "1992-01-01" as year
union all
select "UK" as country, 73 as value, "1993-01-01" as year
union all
select "UK" as country, 80 as value, "1994-01-01" as year
union all
select "UK" as country, 83 as value, "1995-01-01" as year
union all
select "UK" as country, 85 as value, "1996-01-01" as year
union all
select "China" as country, 30 as value, "1990-01-01" as year
union all
select "China" as country, 33 as value, "1991-01-01" as year
union all
select "China" as country, 40 as value, "1992-01-01" as year
union all
select "China" as country, 52 as value, "1993-01-01" as year
union all
select "China" as country, 65 as value, "1994-01-01" as year
union all
select "China" as country, 78 as value, "1995-01-01" as year
union all
select "China" as country, 101 as value, "1996-01-01" as year

```

```date_check_3
select date("1990-01-01") as date, 100 as value
union all
select date("1990-02-01") as date, 105 as value
union all
select date("1990-03-01") as date, 111 as value
union all
select date("1990-04-01") as date, 118 as value
union all
select date("1990-05-01") as date, 121 as value
union all
select date("1990-06-01") as date, 130 as value
union all
select date("1990-07-01") as date, 144 as value
union all
select date("1990-08-01") as date, 147 as value
union all
select date("1990-09-01") as date, 155 as value
union all
select date("1990-10-01") as date, 175 as value

```

```date_check_4
select date("1990-01-15") as date, 100 as value
union all
select date("1990-02-01") as date, 105 as value
union all
select date("1990-03-01") as date, 111 as value
union all
select date("1990-03-02") as date, 118 as value
union all
select date("1990-05-02") as date, 121 as value
union all
select date("1990-05-21") as date, 141 as value
```