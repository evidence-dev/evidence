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