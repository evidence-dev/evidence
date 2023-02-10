# Tantum protulit caligine petunt

## Venn Diagram

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

<VennDiagram
    labels={["Title A", "Title B", "Title C"]}
    amounts={["AMOUNT A", "AMOUNT B", "AMOUNT C"]}
    overlaps={["A", "AB", "BC", "AC", "ABC"]}
/>

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;
attigimus restabat exitus. Praedaeque ademit. _Vix_ eundem, saevarum et nescia
inter retinentibus inaniter pontum! `pages/index.md`

### Pascua tigres inde

Domino cuncta dicenda. Serpente paludem et nubes Cithaeron alios mihi non.

- Cernit traxerunt oras devolvere opibusque gerit Tatiusque
- Aethere mihi pirithoi fontes concretaque hic obuncis
- Solitas fibras aures et verba hiatus et
- Secutum idonea
- Et vocem inquit
- Dum aequi Xanthique minantia nec taurum

#### Aniles orantem Saeculaque pars a aetas nostrum

Opposuitque solis ausis vivo est adventum rudis, nunc fuerant: si
[laedi](http://sic-conamine.org/), et. Nostro verba et celer purpura utraque
parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae
miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere
innuba.

1. Seque nepotemque colla
2. Ego sanguine iphis Tartara crudeles et et
3. Peritura auro tulit harenis sucos
4. Per turbata caput

##Sankey diagram

```traffic_data
select 'google' as source, 'all_traffic' as target, 100 as count
union all
select 'direct' as source, 'all_traffic' as target, 50 as count
union all
select 'facebook' as source, 'all_traffic' as target, 25 as count
union all
select 'bing' as source, 'all_traffic' as target, 25 as count
union all
select 'linkedin' as source, 'all_traffic' as target, 25 as count
union all
select 'twitter' as source, 'all_traffic' as target, 25 as count
union all
select 'tiktok' as source, 'all_traffic' as target, 25 as count
union all
select 'pinterest' as source, 'all_traffic' as target, 25 as count
union all
select 'all_traffic' as source, '/' as target, 50 as count
union all
select 'all_traffic' as source, '/docs' as target, 150 as count
union all
select 'all_traffic' as source, '/blog' as target, 25 as count
union all
select 'all_traffic' as source, '/about' as target, 75 as count

```

<SankeyDiagram data={traffic_data} title="Sankey Diagram" subtitle="A simple sankey diagram" sourceCol=source targetCol=target valueCol=count />
