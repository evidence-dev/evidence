# Tutorial

```intro
    select "2009-12-31" as year, "Canada" as country, 10000000 as sales_usd
    union all
    select "2010-12-31" as year, "Canada" as country, 13500000 as sales_usd
    union all
    select "2011-12-31" as year, "Canada" as country, 16800000 as sales_usd
    union all
    select "2012-12-31" as year, "Canada" as country, 18900000 as sales_usd
    union all
    select "2013-12-31" as year, "Canada" as country, 24000000 as sales_usd
    union all
    select "2014-12-31" as year, "Canada" as country, 28200000 as sales_usd
    union all
    select "2015-12-31" as year, "Canada" as country, 29400000 as sales_usd
    union all
    select "2016-12-31" as year, "Canada" as country, 18800000 as sales_usd
    union all
    select "2017-12-31" as year, "Canada" as country, 20100000 as sales_usd
    union all
    select "2018-12-31" as year, "Canada" as country, 24400000 as sales_usd
    union all
    select "2019-12-31" as year, "Canada" as country, 26800000 as sales_usd
    union all
    select "2020-12-31" as year, "Canada" as country, 37600000 as sales_usd
    union all
    select "2021-12-31" as year, "Canada" as country, 43400000 as sales_usd
    union all
    select "2009-12-31" as year, "US" as country, 11400000 as sales_usd
    union all
    select "2010-12-31" as year, "US" as country, 15200000 as sales_usd
    union all
    select "2011-12-31" as year, "US" as country, 18800000 as sales_usd
    union all
    select "2012-12-31" as year, "US" as country, 21600000 as sales_usd
    union all
    select "2013-12-31" as year, "US" as country, 22500000 as sales_usd
    union all
    select "2014-12-31" as year, "US" as country, 23200000 as sales_usd
    union all
    select "2015-12-31" as year, "US" as country, 25100000 as sales_usd
    union all
    select "2016-12-31" as year, "US" as country, 28000000 as sales_usd
    union all
    select "2017-12-31" as year, "US" as country, 33800000 as sales_usd
    union all
    select "2018-12-31" as year, "US" as country, 34800000 as sales_usd
    union all
    select "2019-12-31" as year, "US" as country, 37700000 as sales_usd
    union all
    select "2020-12-31" as year, "US" as country, 39000000 as sales_usd
    union all
    select "2021-12-31" as year, "US" as country, 40100000 as sales_usd
    union all
    select "2009-12-31" as year, "UK" as country, 11100000 as sales_usd
    union all
    select "2010-12-31" as year, "UK" as country, 10600000 as sales_usd
    union all
    select "2011-12-31" as year, "UK" as country, 10400000 as sales_usd
    union all
    select "2012-12-31" as year, "UK" as country, 10100000 as sales_usd
    union all
    select "2013-12-31" as year, "UK" as country, 10800000 as sales_usd
    union all
    select "2014-12-31" as year, "UK" as country, 12000000 as sales_usd
    union all
    select "2015-12-31" as year, "UK" as country, 14100000 as sales_usd
    union all
    select "2016-12-31" as year, "UK" as country, 15800000 as sales_usd
    union all
    select "2017-12-31" as year, "UK" as country, 19400000 as sales_usd
    union all
    select "2018-12-31" as year, "UK" as country, 21100000 as sales_usd
    union all
    select "2019-12-31" as year, "UK" as country, 23400000 as sales_usd
    union all
    select "2020-12-31" as year, "UK" as country, 25800000 as sales_usd
    union all
    select "2021-12-31" as year, "UK" as country, 28800000 as sales_usd
```

<LineChart
    data={data.intro}
    x=year
    y=sales_usd
    series=country
    title="Sales by Country"
    subtitle="$ in USD"
/>

```us_sales
select *
from ${intro} 
where country = "US"
order by year desc
```

US sales in the most recent year (<Value data={data.us_sales} column=year/>) were <Value data={data.us_sales} column=sales_usd />

