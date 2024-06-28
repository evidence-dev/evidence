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
	export let labelColor = undefined;

	/** @type {import('../colors.js').Color | undefined} */
	export let symbolColor = undefined;

	/** @type {number | undefined} */
	export let labelWidth = undefined;

	/** @type {import('./reference-point.d.ts').LabelPosition} */
	export let labelPosition = 'top';

	/** @type {string} */
	export let labelBackground = 'hsla(360, 100%, 100%, 0.7)';

	/** @type {number | undefined} */
	export let labelBorderWidth = undefined;

	/** @type {number | undefined} */
	export let labelBorderRadius = undefined;

	/** @type {string | undefined} */
	export let labelBorderColor = undefined;

	/** @type {'solid' | 'dotted' | 'dashed' | undefined}*/
	export let labelBorderType = undefined;

	/** @type {'always' | 'hover'} */
	export let labelVisible = 'always';

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = Query.isQuery(data) && data.hash === initialHash;

	/** @type {HTMLElement | undefined} */
	let slotElement = undefined;
	$: label = label ?? slotElement?.textContent;

	// Default labelBorderWidth and labelBorderColor if only one is given
	$: {
		if (labelBorderColor && typeof labelBorderWidth === 'undefined') {
			labelBorderWidth = 1;
		} else if (labelBorderWidth && !labelBorderColor) {
			labelBorderColor = 'gray';
		}
	}

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
		labelWidth,
		labelPosition,
		labelBackground,
		labelBorderWidth,
		labelBorderRadius,
		labelBorderColor,
		labelBorderType,
		labelVisible
	};
</script>

{#if $$slots.default}
	<div class="invisible" bind:this={slotElement}>
		<slot />
	</div>
{/if}

{#if $store.error}
	<ErrorChart error={$store.error} minHeight="50px" {chartType} />
{:else}
	<QueryLoad {data}>
		<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
		<ErrorChart let:loaded slot="error" {chartType} error={loaded.error.message} />
	</QueryLoad>
{/if}
