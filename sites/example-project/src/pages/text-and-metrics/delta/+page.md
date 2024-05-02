# Delta

```sql sp
select 100 as sales, '2020-01-01'::date as date
union all
select null as sales, '2020-02-01'::date as date
union all
select 0 as sales, '2020-03-01'::date as date
union all
select 170 as sales, '2020-04-01'::date as date
union all
select 190 as sales, '2020-05-01'::date as date
```

### Positive
<Delta value=36.6 fmt=pct1 text="vs. prior year"/> 

### Negative
<Delta value=-0.366 fmt=pct1/> 

### Neutral (when neutralMin and neutralMax set)
<Delta value=0.366 neutralMax=0.4 fmt=pct1/> 

### Zero
<Delta value=0 fmt=pct1/> 

### Null
<Delta value={null} fmt=pct1/> 


## Chip
### Positive
<Delta value=0.366 fmt=pct1 chip=true/> 

### Negative
<Delta value=-0.366 fmt=pct1 chip=true/> 

### Neutral (when neutralMin and neutralMax set)
<Delta value=0.366 neutralMax=0.4 fmt=pct1 chip=true/> 

### Zero
<Delta value=0 fmt=pct1 chip=true /> 

### Null
<Delta value={null} fmt=pct1 chip=true /> 


## Symbol Position

### `symbolPosition=left`
<Delta value=0.366 fmt=pct1 symbolPosition=left  text="vs. prior year"/>  
<LineBreak lines=2/> 
<Delta value=-0.366 fmt=pct1 chip=true symbolPosition=left  text="vs. prior year"s/> 
<LineBreak lines=2/> 
<Delta value={null} fmt=pct1 chip=true symbolPosition=left  text="vs. prior year"s/> 


## In DataTable

<DataTable data={sp}>
    <Column id=sales contentType=delta/>
</DataTable>

<LineBreak lines=2/>

## In Text
Verba et celer purpura utraque parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere innuba.Sales in the last year: <Delta data={sp} column=sales fmt=usd/> <Delta data={sp} column=sales fmt=usd chip=true/> and some text after. verba et celer purpura utraque parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae <Delta data={sp} column=sales fmt=usd chip=true downIsGood=true/> miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere innuba.