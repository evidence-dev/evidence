<script>
let demoData = [
              { name: 'Alabama', population: 4822023 },
              { name: 'Alaska', population: 731449 },
              { name: 'Arizona', population: 6553255 },
              { name: 'Arkansas', population: 2949131 },
              { name: 'California', population: 38041430 },
              { name: 'Colorado', population: 5187582 },
              { name: 'Connecticut', population: 3590347 },
              { name: 'Delaware', population: 917092 },
              { name: 'District of Columbia', population: 632323 },
              { name: 'Florida', population: 19317568 },
              { name: 'Georgia', population: 9919945 },
              { name: 'Hawaii', population: 1392313 },
              { name: 'Idaho', population: 1595728 },
              { name: 'Illinois', population: 12875255 },
              { name: 'Indiana', population: 6537334 },
              { name: 'Iowa', population: 3074186 },
              { name: 'Kansas', population: 2885905 },
              { name: 'Kentucky', population: 4380415 },
              { name: 'Louisiana', population: 4601893 },
              { name: 'Maine', population: 1329192 },
              { name: 'Maryland', population: 5884563 },
              { name: 'Massachusetts', population: 6646144 },
              { name: 'Michigan', population: 9883360 },
              { name: 'Minnesota', population: 5379139 },
              { name: 'Mississippi', population: 2984926 },
              { name: 'Missouri', population: 6021988 },
              { name: 'Montana', population: 1005141 },
              { name: 'Nebraska', population: 1855525 },
              { name: 'Nevada', population: 2758931 },
              { name: 'New Hampshire', population: 1320718 },
              { name: 'New Jersey', population: 8864590 },
              { name: 'New Mexico', population: 2085538 },
              { name: 'New York', population: 19570261 },
              { name: 'North Carolina', population: 9752073 },
              { name: 'North Dakota', population: 699628 },
              { name: 'Ohio', population: 11544225 },
              { name: 'Oklahoma', population: 3814820 },
              { name: 'Oregon', population: 3899353 },
              { name: 'Pennsylvania', population: 12763536 },
              { name: 'Rhode Island', population: 1050292 },
              { name: 'South Carolina', population: 4723723 },
              { name: 'South Dakota', population: 833354 },
              { name: 'Tennessee', population: 6456243 },
              { name: 'Texas', population: 26059203 },
              { name: 'Utah', population: 2855287 },
              { name: 'Vermont', population: 626011 },
              { name: 'Virginia', population: 8185867 },
              { name: 'Washington', population: 6897012 },
              { name: 'West Virginia', population: 1855413 },
              { name: 'Wisconsin', population: 5726398 },
              { name: 'Wyoming', population: 576412 },
              { name: 'Puerto Rico', population: 3667084 }
            ]
</script>

# Maps

```sql map_data
select 'Arkansas' as name, 100 as value
union all
select 'Illinois' as name, 200 as value
union all
select 'Florida' as name, 1000 as value
union all
select 'New York' as name, 1110 as value
union all
select 'California' as name, 2000 as value

```

```sql world_map
select 'Canada' as name, 260 as value
union all
select 'United Kingdom' as name, 300 as value
union all
select 'United States of America' as name, 500 as value
```

```sql us_abbrev
select 'CA' as name, 100 as sales_usd
union all
select 'TX' as name, 120 as sales_usd
union all
select 'FL' as name, 20 as sales_usd
union all
select 'WA' as name, 5 as sales_usd

```

```sql testabb
select 'CA' as namef, 100 as value
union all
select 'TX' as namef, 200 as value
```

## US State Map

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<USMap
    data={us_abbrev}
    state=name
    value=sales_usd
    colorScale=blue
    abbreviations=true
    title="US Sales Data"
    subtitle="Texas leading in sales"
/>

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<USMap
    data={demoData}
    state=name
    value=population
    colorScale=red
    abbreviations=false
/>

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?
