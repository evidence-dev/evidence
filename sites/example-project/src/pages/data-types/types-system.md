<script>
    import TypeExplorer from '$lib/viz/TypeExplorer.svelte'
</script>

# Types system

## Uno sine at nunc pontus rectorque umeros

Lorem markdownum nivea redimitus. In rector in, flumine adimunt, cinctum, dolore
pallada senectus dixit? Crematisregia fetus Io locus viscera redde lucida
discede?

Est qui conciderant, parte haud effugit dixerat. Retentas Pelasga vivunt;
attigimus restabat exitus. Praedaeque ademit. *Vix* eundem, saevarum et nescia
inter retinentibus inaniter pontum!


```types 

(select 
    'Ontario' as province, 
    current_date as next_election,
    1457000210 as population,
    false as western )

    union all 

((select 
    'Ontario' as province, 
    current_date as next_election,
    1457002006 as population,
    true as western ))


```

<Value data={types} column=next_election/> 


## Pascua tigres inde

Domino cuncta dicenda. Serpente paludem et nubes Cithaeron alios mihi non.

- Cernit traxerunt oras devolvere opibusque gerit Tatiusque
- Aethere mihi pirithoi fontes concretaque hic obuncis
- Solitas fibras aures et verba hiatus et
- Secutum idonea
- Et vocem inquit
- Dum aequi Xanthique minantia nec taurum


<DataTable queryID='types'/>

<TypeExplorer queryID='types'/> 