```sql state_current
select "CA" as state, "2022-12" as month, 198 as value, "states/CA" as state_link
union all
select "NY" as state, "2022-12" as month, 321 as value, "states/NY" as state_link
union all
select "TX" as state, "2022-12" as month, 321 as value, "states/TX" as state_link
```

```sql most_recent_month
select max(month) as month from ${state_current}
```

<USMap 
    data={state_current} 
    state=state 
    value=value 
    abbreviations=true
    link=state_link
    title="Sales by State"
    subtitle="{most_recent_month[0].month}"
/>
