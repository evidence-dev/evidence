<script> 

import BigValue from "$lib/BigValue.svelte";

</script>

# Tantum protulit caligine petunt


```banks_established
select 
date_trunc(established_date, year) as established_date, 
count(*)*10 as new_banks,
100*row_number() over() - rand()*100 as another_metric_usd,
2.12 as growth_pct,
-0.07 as another_growth_pct

from `bigquery-public-data.fdic_banks.institutions`
group by established_date
order by established_date desc 

```



<BigValue 
    data={data.banks_established} 
    metric=new_banks 
    delta=growth_pct 
    deltaTitle="Y/Y Growth"
    timeSeries=established_date
    /> 

<BigValue 
    data={data.banks_established} 
    metric=another_metric_usd 
    title="ARR per Logo" 
    delta=another_growth_pct 
    deltaTitle="This month"
/> 


Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<LineChart data = {data.banks_established} y=new_banks /> 

## Uno sine at nunc pontus rectorque umeros

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt; Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;
attigimus restabat exitus. Praedaeque ademit. *Vix* eundem, saevarum et nescia
inter retinentibus inaniter pontum! `pages/index.md`

<BigValue 
    data={data.banks_established} 
    metric=new_banks 
    delta=growth_pct 
    deltaTitle="Y/Y Growth"
    timeSeries=established_date
    /> 

<BigValue 
    data={data.banks_established} 
    metric=another_metric_usd 
    title="ARR per Logo" 
    delta=another_growth_pct 
    deltaTitle="This month"
/> 


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
