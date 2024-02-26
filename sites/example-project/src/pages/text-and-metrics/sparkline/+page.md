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
- Sales in the last year: <Sparkline data={sp} dateCol=date valueCol=sales type=bar interactive=true yScale=false valueFmt=eur dateFmt=mmm color=darkgreen/> and some text after

### Connected Sparklines
<Sparkline data={sp} dateCol=date valueCol=sales type=bar    interactive=true yScale=false valueFmt=eur dateFmt=mmm connect=true/>
<Sparkline data={sp} dateCol=date valueCol=sales type=area color=maroon interactive=true yScale=false valueFmt=eur dateFmt=mmm connect=true/>
<Sparkline data={sp} dateCol=date valueCol=sales type=line color=purple interactive=true yScale=false valueFmt=eur dateFmt=mmm connect=true/>

### With Negative Values
<Sparkline data={sp2} dateCol=date valueCol=sales type=bar    interactive=true yScale=false valueFmt=eur dateFmt=mmm/>
<Sparkline data={sp2} dateCol=date valueCol=sales type=area color=maroon interactive=true yScale=false valueFmt=eur dateFmt=mmm/>
<Sparkline data={sp2} dateCol=date valueCol=sales type=line color=purple interactive=true yScale=false valueFmt=eur dateFmt=mmm/>

### Custom Dimenstions
<Sparkline data={sp} dateCol=date valueCol=sales type=area color=maroon interactive=true yScale=false valueFmt=eur dateFmt=mmm height=30 width=20/>
<Sparkline data={sp} dateCol=date valueCol=sales type=line color=purple interactive=true yScale=false valueFmt=eur dateFmt=mmm height=30 width=300/>
<Sparkline data={sp} dateCol=date valueCol=sales type=bar    interactive=true yScale=false valueFmt=eur dateFmt=mmm height=80 width=120/>