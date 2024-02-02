<script context="module">
	export const evidenceInclude = true;
</script>

<script>

	// To add:
	// 1. error handling
	// 2. Data download
	// 3. Value formatting
	// 4. Legend control
	// 5. Axis formatting control
	// 6. Title & subtitle
	// 7. Proper height setting
	// 8. Check reactivity
	// 9. Check PDF formatting
	// 10. Percentages?
	// 11. Tooltip or tooltip control
	// 12. Check nulls

	// Then:
	// 1. Set up for calendar heatmap

	import ECharts from '../core/ECharts.svelte';

	export let data;
	export let x;
	export let y;
	export let value;

	// Data needs to get into format:
	// 1) x-axis: distinct x values in order defined by query
	// 2) y-axis: distinct y values in order defined by query
	// 3) Array of arrays: [x index, y index, value] - nulls or 0 should be "-"?

	function getDistinctValues(data, column) {
		let distinctValues = [];
		const distinctValueSet = new Set();
		data.forEach((d) => {
			distinctValueSet.add(d[column]);
		});
		distinctValues = [...distinctValueSet];
		return distinctValues;
	}

	let xDistinct = getDistinctValues(data, x);
	let yDistinct = getDistinctValues(data, y);

	function mapColumnsToArray(arrayOfObjects, col1, col2, col3) {
		return arrayOfObjects.map((obj) => [obj[col1], obj[col2], obj[col3]]);
	}

	let arrayOfArrays = mapColumnsToArray(data, x, y, value);

	let valueMin = Math.min(...data.map((d) => d[value]));
	let valueMax = Math.max(...data.map((d) => d[value]));
</script>

<ECharts
	config={{
		tooltip: {
			position: 'top'
		},
		grid: {
			height: '50%',
			top: '10%'
		},
		xAxis: {
			type: 'category',
			data: xDistinct,
			splitArea: {
				show: true
			}
		},
		yAxis: {
			type: 'category',
			data: yDistinct,
			splitArea: {
				show: true
			}
		},
		visualMap: {
			min: valueMin,
			max: valueMax,
			calculable: true,
			orient: 'horizontal',
			left: 'center',
			bottom: '15%'
		},
		series: [
			{
				type: 'heatmap',
				data: arrayOfArrays,
				label: {
					show: true
				},
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowColor: 'rgba(0, 0, 0, 0.5)'
					}
				}
			}
		]
	}}
/>
