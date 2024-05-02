# Sparkline

```sql sp
select 100 as sales, '2020-01-01'::date as date
union all
select 120 as sales, '2020-02-01'::date as date
union all
select 140 as sales, '2020-03-01'::date as date
union all
select 170 as sales, '2020-04-01'::date as date
union all
select 190 as sales, '2020-05-01'::date as date
```

```sql sp2
select 100 as sales, '2020-01-01'::date as date
union all
select 120 as sales, '2020-02-01'::date as date
union all
select -140 as sales, '2020-03-01'::date as date
union all
select -170 as sales, '2020-04-01'::date as date
union all
select 190 as sales, '2020-05-01'::date as date
```

## Basic Sparkline

### Static
<Sparkline data={sp} dateCol=date valueCol=sales type=line interactive=false yScale=false valueFmt=eur dateFmt=mmm/>

### Interactive
<Sparkline data={sp} dateCol=date valueCol=sales type=line interactive=true yScale=false valueFmt=eur dateFmt=mmm/>

### Inline Sparkline
verba et celer purpura utraque parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere innuba.Sales in the last year: <Sparkline data={sp} dateCol=date valueCol=sales type=bar interactive=true yScale=false valueFmt=eur dateFmt=mmm color=darkgreen/> and some text after. verba et celer purpura utraque parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere innuba.

### Connected Sparklines
<Sparkline data={sp} dateCol=date valueCol=sales type=bar    interactive=true yScale=false valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sp} dateCol=date valueCol=sales type=area color=maroon interactive=true yScale=false valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sp} dateCol=date valueCol=sales type=line color=purple interactive=true yScale=false valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>

### With Negative Values
<Sparkline data={sp2} dateCol=date valueCol=sales type=bar    interactive=true yScale=false valueFmt=eur dateFmt=mmm/>
<Sparkline data={sp2} dateCol=date valueCol=sales type=area color=maroon interactive=true yScale=false valueFmt=eur dateFmt=mmm/>
<Sparkline data={sp2} dateCol=date valueCol=sales type=line color=purple interactive=true yScale=false valueFmt=eur dateFmt=mmm/>

### Custom Dimenstions
<Sparkline data={sp} dateCol=date valueCol=sales type=area color=maroon interactive=true yScale=false valueFmt=eur dateFmt=mmm height=30 width=20/>
<Sparkline data={sp} dateCol=date valueCol=sales type=line color=purple interactive=true yScale=false valueFmt=eur dateFmt=mmm height=30 width=300/>
<Sparkline data={sp} dateCol=date valueCol=sales type=bar    interactive=true yScale=false valueFmt=eur dateFmt=mmm height=80 width=120/>


## Reactivity

```sql dynamic
select 'a' as category, '2020-01-01'::date as year, 100 as value
union all
select 'a', '2021-01-01'::date, 130
union all
select 'a', '2022-01-01'::date, 150
union all
select 'a', '2023-01-01'::date, 170
union all
select 'a', '2024-01-01'::date, 190
union all
select 'b', '2020-01-01'::date, 50
union all
select 'b', '2021-01-01'::date, 60
union all
select 'b', '2022-01-01'::date, 100
union all
select 'b', '2023-01-01'::date, 80
union all
select 'b', '2024-01-01'::date, 130
```

<Dropdown data={dynamic} name=category value=category defaultValue=a/>

```sql dynamic_filtered
select * from ${dynamic}
where category like '${inputs.category.value}'
```

<Sparkline data={dynamic_filtered} dateCol=year valueCol=value interactive=false/>
<LineBreak lines=1/>

<Sparkline data={dynamic_filtered} dateCol=year valueCol=value interactive=true/>
<LineBreak lines=1/>

<BigValue
    data={dynamic_filtered}
    value=value
    sparkline=year
/>