<script> 

import BigValue from "$lib/BigValue.svelte";

</script>

# Tantum protulit caligine petunt


```banks_established
select 
date_trunc(established_date, year) as established_date, 
count(*)*10 as new_banks,
-0.15 as growth_pct

from `bigquery-public-data.fdic_banks.institutions`
group by established_date
order by established_date desc 

```

<BigValue 
data = {data.banks_established} 
value=new_banks
delta=growth_pct
deltaTitle="Annualized growth"
title="Banks created YTD" 
downIsGood
sparkline={false}
/> 

<BigValue data = {data.banks_established} /> 

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<LineChart data = {data.banks_established} y=new_banks/> 

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
