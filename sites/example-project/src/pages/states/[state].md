```sql state_current
select "CA" as state, "2022-12" as month, 198 as value
union all
select "NY" as state, "2022-12" as month, 321 as value
union all
select "TX" as state, "2022-12" as month, 321 as value
union all
select "AL" as state, "2022-12" as month, 321 as value
union all
select "DC" as state, "2022-12" as month, 321 as value
union all
select "FL" as state, "2022-12" as month, 321 as value
union all
select "GA" as state, "2022-12" as month, 321 as value
union all
select "ID" as state, "2022-12" as month, 321 as value
union all
select "IL" as state, "2022-12" as month, 321 as value
union all
select "LA" as state, "2022-12" as month, 321 as value
union all
select "MO" as state, "2022-12" as month, 321 as value
union all
select "MI" as state, "2022-12" as month, 321 as value
union all
select "MS" as state, "2022-12" as month, 321 as value
union all
select "NE" as state, "2022-12" as month, 321 as value
union all
select "NV" as state, "2022-12" as month, 321 as value
union all
select "OH" as state, "2022-12" as month, 321 as value
union all
select "OK" as state, "2022-12" as month, 321 as value
union all
select "PA" as state, "2022-12" as month, 321 as value
union all
select "RI" as state, "2022-12" as month, 321 as value
union all
select "CT" as state, "2022-12" as month, 321 as value
union all
select "SD" as state, "2022-12" as month, 321 as value
union all
select "ND" as state, "2022-12" as month, 321 as value
union all
select "MT" as state, "2022-12" as month, 321 as value
union all
select "UT" as state, "2022-12" as month, 321 as value
union all
select "VA" as state, "2022-12" as month, 321 as value
union all
select "WV" as state, "2022-12" as month, 321 as value

```

```sql state_trend
select "CA" as state, date("2022-01-01") as month, 100 as value
union all
select "CA" as state, date("2022-02-01") as month, 103 as value
union all
select "CA" as state, date("2022-03-01") as month, 106 as value
union all
select "CA" as state, date("2022-04-01") as month, 111 as value
union all
select "CA" as state, date("2022-05-01") as month, 121 as value
union all
select "CA" as state, date("2022-06-01") as month, 102 as value
union all
select "CA" as state, date("2022-07-01") as month, 112 as value
union all
select "CA" as state, date("2022-08-01") as month, 103 as value
union all
select "CA" as state, date("2022-09-01") as month, 98 as value
union all
select "CA" as state, date("2022-10-01") as month, 121 as value
union all
select "CA" as state, date("2022-11-01") as month, 146 as value
union all
select "CA" as state, date("2022-12-01") as month, 198 as value
union all
select "NY" as state, date("2022-01-01") as month, 200 as value
union all
select "NY" as state, date("2022-02-01") as month, 203 as value
union all
select "NY" as state, date("2022-03-01") as month, 206 as value
union all
select "NY" as state, date("2022-04-01") as month, 211 as value
union all
select "NY" as state, date("2022-05-01") as month, 222 as value
union all
select "NY" as state, date("2022-06-01") as month, 235 as value
union all
select "NY" as state, date("2022-07-01") as month, 265 as value
union all
select "NY" as state, date("2022-08-01") as month, 288 as value
union all
select "NY" as state, date("2022-09-01") as month, 312 as value
union all
select "NY" as state, date("2022-10-01") as month, 285 as value
union all
select "NY" as state, date("2022-11-01") as month, 292 as value
union all
select "NY" as state, date("2022-12-01") as month, 321 as value
union all
select "TX" as state, date("2022-01-01") as month, 250 as value
union all
select "TX" as state, date("2022-02-01") as month, 223 as value
union all
select "TX" as state, date("2022-03-01") as month, 236 as value
union all
select "TX" as state, date("2022-04-01") as month, 261 as value
union all
select "TX" as state, date("2022-05-01") as month, 182 as value
union all
select "TX" as state, date("2022-06-01") as month, 85 as value
union all
select "TX" as state, date("2022-07-01") as month, 95 as value
union all
select "TX" as state, date("2022-08-01") as month, 212 as value
union all
select "TX" as state, date("2022-09-01") as month, 312 as value
union all
select "TX" as state, date("2022-10-01") as month, 285 as value
union all
select "TX" as state, date("2022-11-01") as month, 292 as value
union all
select "TX" as state, date("2022-12-01") as month, 321 as value
```

# Detail for {$page.params.state}

<LineChart data={state_trend.filter(d => d.state === $page.params.state)} x=month y=value/>
