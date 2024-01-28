# Sankey Diagram Page

```sql simple_sankey
select 'products' as source, 'profits' as target, 100 as amount, 0.67 as percent
union all
select 'products' as source, 'expenses' as target, 50 as amount, 0.33 as percent
union all
select 'services' as source, 'profits' as target, 25 as amount, 0.50 as percent
union all
select 'services' as source, 'expenses' as target, 25 as amount, 0.50 as percent
```

<SankeyDiagram data={simple_sankey} linkLabels=percent linkColor=source title="Sankey Diagram" subtitle="A simple sankey diagram" sourceCol=source targetCol=target valueCol=amount valueFmt = 'usd' percentCol=percent/>


## Aniles orantem Saeculaque pars a aetas nostrum

Opposuitque solis ausis vivo est adventum rudis, nunc fuerant: si
[laedi](http://sic-conamine.org/), et. Nostro verba et celer purpura utraque
parvas, indicat quaeritis adhaesi negate. Exsangue sibique Minos Echidnaeae
miseranda infelix nunc dapes iunctisque praetereunt abluere moenia ferunt aere
innuba.

```sql traffic_data
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

<SankeyDiagram data={traffic_data} title="Sankey Diagram" subtitle="A simple sankey diagram" sourceCol=source targetCol=target valueCol=count 
linkLabels=true/>

```sql apple_income_statement
select 'iphone' as source, 'product revenue' as target, 51 as amount_usd
union all
select 'mac' as source, 'product revenue' as target, 10 as amount_usd
union all
select 'ipad' as source, 'product revenue' as target, 8 as amount_usd
union all
select 'wearables and home' as source, 'product revenue' as target, 9 as amount_usd
union all
select 'services revenue' as source, 'revenue' as target, 20 as amount_usd
union all
select 'product revenue' as source, 'revenue' as target, 78 as amount_usd
union all
select 'revenue' as source, 'gross profit' as target, 43 as amount_usd
union all
select 'gross profit' as source, 'operating profit' as target, 30 as amount_usd
union all
select 'gross profit' as source, 'operating expenses' as target, 13 as amount_usd
union all
select 'revenue' as source, 'cost of revenue' as target, 55 as amount_usd
```

<SankeyDiagram 
    data={apple_income_statement} 
    title="Apple Income Statement" 
    subtitle="USD Billions" 
    sourceCol=source 
    targetCol=target 
    valueCol=amount_usd 
/>

<SankeyDiagram 
    data={apple_income_statement} 
    title="Apple Income Statement" 
    subtitle="USD Billions" 
    sourceCol=source 
    targetCol=target 
    valueCol=amount_usd 
    orient="vertical"
/>

### Pascua tigres inde

Domino cuncta dicenda. Serpente paludem et nubes Cithaeron alios mihi non.

- Cernit traxerunt oras devolvere opibusque gerit Tatiusque
- Aethere mihi pirithoi fontes concretaque hic obuncis
- Solitas fibras aures et verba hiatus et
- Secutum idonea
- Et vocem inquit
- Dum aequi Xanthique minantia nec taurum

1. Seque nepotemque colla
2. Ego sanguine iphis Tartara crudeles et et
3. Peritura auro tulit harenis sucos
4. Per turbata caput

<script>

let sankeyData = [
      {
        source: 'source',
        target: 'google',
        count: 3
      },
      {
        source: 'source',
        target: 'direct',
        count: 1
      },
      {
        source: 'source',
        target: 'facebook',
        count: 1
      },
      {
        source: 'source',
        target: 'bing',
        count: 1
      },
      {
        source: 'page_url',
        target: '/',
        count: 2
      },
      {
        source: 'page_url',
        target: '/docs',
        count: 3
      }
    ]
</script>

<SankeyDiagram data={sankeyData} title="Sankey" subtitle="A simple sankey Diagram" sourceCol=source targetCol=target valueCol=count />
<SankeyDiagram data={sankeyData} title="Sankey" subtitle="A simple sankey Diagram" orient="vertical" valueCol=count />

```sql traffic_data
select 'google' as source, 'all_traffic' as target, 100 as count
union all
select 'direct' as source, 'all_traffic' as target, 50 as count
union all
select 'facebook' as source, 'all_traffic' as target, 25 as count
union all
select 'bing' as source, 'all_traffic' as target, 25 as count
union all
select 'tiktok' as source, 'all_traffic' as target, 25 as count
union all
select 'twitter' as source, 'all_traffic' as target, 25 as count
union all
select 'linkedin' as source, 'all_traffic' as target, 25 as count
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

<SankeyDiagram data={traffic_data} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count />

# Echarts Options String 

<SankeyDiagram data={traffic_data} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count printEchartsConfig={true} echartsOptions={{
        title: {
            text: "Custom Echarts Option"
        }
    }}/>


## Node Depth Override

<SankeyDiagram 
    data={apple_income_statement} 
    title="Apple Income Statement" 
    subtitle="USD Billions" 
    sourceCol=source 
    targetCol=target 
    valueCol=amount_usd 
    depthOverride={{'services revenue': 1}}
    nodeAlign=left
/>