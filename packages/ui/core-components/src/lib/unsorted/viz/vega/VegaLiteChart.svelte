<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { QueryLoad } from '../../../atoms/query-load';

	import EmptyChart from '../core/EmptyChart.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import VegaLiteRenderer from './VegaLiteRenderer.svelte';

	export let data = undefined;
	export let spec = undefined;

	/** @type {number | string | undefined} */
	export let height = 291;

	/** @type {number | string | undefined} */
	export let width = '100%';

	export let actions = true;
	export let renderer = undefined;
	export let tooltip = undefined;
	export let description = undefined;
	export let embedOptions = undefined;

	export let emptySet = undefined;
	export let emptyMessage = undefined;

	export let title = undefined;
	export let subtitle = undefined;

	export let chartType = 'Vega-Lite Chart';
	export let skeletonClass = undefined;

	const toRows = (value) => (Query.isQuery(value) ? Array.from(value) : value);

	const skeletonHeight = () => (typeof height === 'number' ? height : 231);
</script>

<QueryLoad
	{data}
	height={skeletonHeight()}
	skeletonClass={skeletonClass}
	let:loaded
>
	<EmptyChart
		slot="empty"
		{emptyMessage}
		{emptySet}
		chartType={chartType}
	/>
	<ErrorChart
		slot="error"
		title={chartType}
		error={loaded?.error?.message ?? 'Unable to load Vega-Lite chart data'}
	/>
	{@const rows = toRows(loaded)}
	<VegaLiteRenderer
		data={rows}
		{spec}
		{height}
		{width}
		{actions}
		{renderer}
		{tooltip}
		{description}
		{embedOptions}
		chartType={chartType}
		{title}
		{subtitle}
	/>
	<slot />
</QueryLoad>
