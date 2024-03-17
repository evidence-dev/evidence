# Delta

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

### Positive
<Delta value=0.366 fmt=pct1/> 

### Negative
<Delta value=-0.366 fmt=pct1/> 

### Neutral
<Delta value=0.366 neutralMax=0.4 fmt=pct1/> 


## Chip
### Positive
<Delta value=0.366 fmt=pct1 chip=true/> 

### Negative
<Delta value=-0.366 fmt=pct1 chip=true/> 

### Neutral
<Delta value=0.366 neutralMax=0.4 fmt=pct1 chip=true/> 

<LineBreak lines=2/>

Verba et celer purpura utraque parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere innuba.Sales in the last year: <Delta data={sp} column=sales fmt=usd/> <Delta data={sp} column=sales fmt=usd chip=true/> and some text after. verba et celer purpura utraque parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae <Delta data={sp} column=sales fmt=usd chip=true downIsGood=true/> miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere innuba.
