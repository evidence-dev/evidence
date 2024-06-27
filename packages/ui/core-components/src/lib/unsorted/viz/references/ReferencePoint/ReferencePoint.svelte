<!-- TODO error handling in store and rendering error here -->

<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check
	import { getConfigContext } from '@evidence-dev/component-utilities/chartContext';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';
	import EmptyChart from '../../core/EmptyChart.svelte';
	import ErrorChart from '../../core/ErrorChart.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { createReferencePointStore } from './reference-point.store.js';

	/** @type {'pass' | 'warn' | 'error'}*/
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {number | string | undefined} */
	export let x = undefined;

	/** @type {number | string | undefined} */
	export let y = undefined;

	/** @type {unknown} */
	export let data = undefined;

	/** @type {string | undefined} */
	export let label = undefined;

	/** @type {import('./reference-point.d.ts').Symbol}*/
	export let symbol = 'circle';

	/** @type {number | string} */
	let rawSymbolSize = 8;
	export { rawSymbolSize as symbolSize };
	$: symbolSize = typeof rawSymbolSize === 'string' ? parseFloat(rawSymbolSize) : rawSymbolSize;

	/** @type {import('../colors.js').Color} */
	export let color = 'gray';

	/** @type {import('../colors.js').Color | undefined} */
	export let labelColor;

	/** @type {import('../colors.js').Color | undefined} */
	export let symbolColor;

	/** @type {import('./reference-point.d.ts').LabelPosition} */
	export let labelPosition = 'top';

	/** @type {string} */
	export let labelBackground = 'hsla(360, 100%, 100%, 0.7)';

	/** @type {'always' | 'hover'} */
	export let labelVisible = 'always';

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = Query.isQuery(data) && data.hash === initialHash;

	const chartType = 'Reference Point';

	const config = getConfigContext();
	const store = createReferencePointStore(config);

	$: $store = {
		data,
		x,
		y,
		label,
		symbol,
		color,
		labelColor,
		symbolColor,
		symbolSize,
		labelPosition,
		labelBackground,
		labelVisible
	};
</script>

{#if $store.error}
	<ErrorChart error={$store.error} minHeight="50px" {chartType} />
{:else}
	<QueryLoad {data} let:loaded>
		<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
		<ErrorChart let:loaded slot="error" {chartType} error={loaded.error.message} />
	</QueryLoad>
{/if}
