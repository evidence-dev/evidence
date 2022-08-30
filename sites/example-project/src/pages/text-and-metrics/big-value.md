# Big Value

```banks_established
select 
date_trunc(established_date, year) as established_date, 
13723*count(*) as new_projects_num0,
count(*)*327982 as arr_usd1m,

0.12 as growth_pct,
1.29 as arr_growth_pct 


from `bigquery-public-data.fdic_banks.institutions`
group by established_date
order by established_date desc 
```

<BigValue 
data = {data.banks_established} 
/> 


<BigValue 
data = {data.banks_established} 
value=new_projects_num0 
comparison=growth_pct
comparisonTitle="Month over Month"
title="New Activations" 
/> 

<BigValue data = {data.banks_established} 
value=arr_usd1m
title="Run Rate MRR"
comparison=arr_growth_pct
comparisonTitle="YTD" 
sparkline={false}
/> 

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<LineChart 
data = {data.banks_established} y=new_projects_num0
yAxisTitle="New Activations"
/> 


## Uno sine at nunc pontus rectorque umeros

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt; Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;
attigimus restabat exitus. Praedaeque ademit. *Vix* eundem, saevarum et nescia
inter retinentibus inaniter pontum! `pages/index.md`

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?


## Pascua tigres inde

Domino cuncta dicenda. Serpente paludem et nubes Cithaeron alios mihi non.

- Cernit traxerunt oras devolvere opibusque gerit Tatiusque
- Aethere mihi pirithoi fontes concretaque hic obuncis
- Solitas fibras aures et verba hiatus et
- Secutum idonea
- Et vocem inquit
- Dum aequi Xanthique minantia nec taurum
