<script>
    import LineChart from '$lib/viz/LineChart.svelte'
    import AreaChart from '$lib/viz/AreaChart.svelte'
    import BubbleChart from '$lib/viz/BubbleChart.svelte'
    import BarChart from '$lib/viz/BarChart.svelte'
    import Histogram from '$lib/viz/Histogram.svelte'
    import ScatterPlot from '$lib/viz/ScatterPlot.svelte'
    import DataTable from '$lib/viz/DataTable.svelte'
    import Value from '$lib/viz/Value.svelte'

    import getCompletedData from '$lib/modules/getCompletedData.js';

let numberSeriesFull = 
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 2, series: 'a', y: 14},
{x: 2, series: 'b', y: 26},
{x: 2, series: 'c', y: 51},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]
</script>

<AreaChart data={numberSeriesFull} series=series title="Full Data"/>
