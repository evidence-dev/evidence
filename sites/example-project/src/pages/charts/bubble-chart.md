<script>
let smallb = [
    {x: 1, y: 10, size: 1},
    {x: 2, y: 20, size: 10},
    {x: 3, y: 30, size: 50},
    {x: 4, y: 40, size: 75},
    {x: 5, y: 50, size: 100}
]

let region_bubble = [
    {region: 'West', score_a: 63, score_b: 51, size: 55},
    {region: 'West', score_a: 61, score_b: 52, size: 8},
    {region: 'West', score_a: 69, score_b: 35, size: 12},
    {region: 'West', score_a: 50, score_b: 39, size: 28},
    {region: 'West', score_a: 58, score_b: 49, size: 65},
    {region: 'West', score_a: 59, score_b: 49, size: 95},
    {region: 'West', score_a: 50, score_b: 46, size: 31},
    {region: 'West', score_a: 72, score_b: 34, size: 6},
    {region: 'West', score_a: 69, score_b: 54, size: 55},
    {region: 'West', score_a: 46, score_b: 37, size: 78},
    {region: 'West', score_a: 58, score_b: 31, size: 16},
    {region: 'West', score_a: 50, score_b: 31, size: 33},
    {region: 'West', score_a: 71, score_b: 48, size: 64},
    {region: 'West', score_a: 61, score_b: 47, size: 89},
    {region: 'East', score_a: 45, score_b: 39, size: 26},
    {region: 'East', score_a: 68, score_b: 42, size: 66},
    {region: 'East', score_a: 69, score_b: 62, size: 30},
    {region: 'East', score_a: 59, score_b: 44, size: 23},
    {region: 'East', score_a: 86, score_b: 57, size: 20},
    {region: 'East', score_a: 90, score_b: 41, size: 43},
    {region: 'East', score_a: 66, score_b: 60, size: 25},
    {region: 'East', score_a: 70, score_b: 41, size: 2},
    {region: 'East', score_a: 59, score_b: 42, size: 71},
    {region: 'East', score_a: 64, score_b: 69, size: 84},
    {region: 'East', score_a: 85, score_b: 84, size: 73},
    {region: 'East', score_a: 77, score_b: 54, size: 91},
    {region: 'East', score_a: 74, score_b: 48, size: 52},
    {region: 'East', score_a: 88, score_b: 44, size: 21},
    {region: 'East', score_a: 84, score_b: 85, size: 17},
    {region: 'East', score_a: 78, score_b: 87, size: 99},
    {region: 'South', score_a: 120, score_b: 69, size: 1},
    {region: 'South', score_a: 106, score_b: 74, size: 13},
    {region: 'South', score_a: 117, score_b: 67, size: 68},
    {region: 'South', score_a: 89, score_b: 100, size: 36},
    {region: 'South', score_a: 77, score_b: 65, size: 36},
    {region: 'South', score_a: 100, score_b: 70, size: 58},
    {region: 'South', score_a: 76, score_b: 52, size: 27},
    {region: 'South', score_a: 111, score_b: 81, size: 49},
    {region: 'South', score_a: 92, score_b: 103, size: 22},
    {region: 'South', score_a: 105, score_b: 77, size: 71},
    {region: 'South', score_a: 75, score_b: 89, size: 50},
    {region: 'South', score_a: 104, score_b: 82, size: 25},
    {region: 'South', score_a: 109, score_b: 68, size: 85},
    {region: 'South', score_a: 102, score_b: 88, size: 62},
    {region: 'South', score_a: 82, score_b: 68, size: 3}
]
</script>

## Bubble Chart
<BubbleChart data={smallb} x=x y=y size=size xAxisTitle=true yAxisTitle=true/>

## Multi-Series Bubble Chart
<BubbleChart data={region_bubble} x=score_a y=score_b size=size series=region xAxisTitle=true yAxisTitle=true />

## Bubble Chart with Tooltip Title
<BubbleChart data={smallb} x=x y=y size=size xAxisTitle=true yAxisTitle=true tooltipTitle=y/>

## Multi-Series Bubble Chart with Tooltip Title
<BubbleChart data={region_bubble} x=score_a y=score_b size=size series=region xAxisTitle=true yAxisTitle=true tooltipTitle=region/>