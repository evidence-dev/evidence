---
title: Big Value
queries:
  - orders_with_comparisons: orders_with_comparisons.sql
---

```owc
select * from ${orders_with_comparisons}
where category = 'Odd Equipment'
```

<BigValue 
data = {owc} 
value=sales_usd0k
sparkline=month
comparison=sales_change_pct0
comparisonTitle="vs. Last Month"
sparklineType=area
connectGroup=bigvalues
comparisonDelta=false
/>

<BigValue data = {owc} 
value=num_orders_num0
title="Orders"
sparkline=month
sparklineType=bar
comparison=num_orders_change_pct0
comparisonTitle="vs. Last Month"
sparklineColor=maroon
sparklineDateFmt=shortdate
connectGroup=bigvalues
/>

<BigValue data = {owc} 
value=aov_usd2
title="AOV ($)"
sparkline=month
comparison=aov_change_pct0
comparisonTitle="vs. Last Month"
sparklineColor=navy
sparklineDateFmt=mmm
sparklineYScale=true
connectGroup=bigvalues
/> 

<BigValue data = {owc} 
value=aov_usd2
title="AOV ($)"
sparkline=month
comparison=aov_change_pct0
comparisonTitle="vs. Last Month"
sparklineColor=navy
sparklineDateFmt=mmm
sparklineYScale=true
connectGroup=bigvalues
neutralMin=-0.07
neutralMax=0.07
/> 

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<LineChart
data = {orders_with_comparisons.filter(d => d.category === "Sinister Toys")}
y=sales_usd0k
yAxisTitle="Sales"
/>

## Down Is Good

`downIsGood=true`

<BigValue data = {owc} 
value=num_orders_num0
title="Orders"
sparkline=month
sparklineType=bar
comparison=num_orders_change_pct0
comparisonTitle="vs. Last Month"
sparklineColor=maroon
sparklineDateFmt=shortdate
connectGroup=bigvalues
downIsGood=true
/>

## Uno sine at nunc pontus rectorque umeros

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt; Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;
attigimus restabat exitus. Praedaeque ademit. _Vix_ eundem, saevarum et nescia
inter retinentibus inaniter pontum! `pages/index.md`

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

# Error state
<BigValue 
data = {orders_with_comparisons} 
/>


## Pascua tigres inde

Domino cuncta dicenda. Serpente paludem et nubes Cithaeron alios mihi non.

- Cernit traxerunt oras devolvere opibusque gerit Tatiusque
- Aethere mihi pirithoi fontes concretaque hic obuncis
- Solitas fibras aures et verba hiatus et
- Secutum idonea
- Et vocem inquit
- Dum aequi Xanthique minantia nec taurum
