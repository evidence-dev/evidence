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

<SankeyChart data={sankeyData} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count />
<SankeyChart data={sankeyData} title="Sankey" subtitle="A simple sankey chart" orient="vertical" valueCol=count />

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

<SankeyChart data={traffic_data} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count />
