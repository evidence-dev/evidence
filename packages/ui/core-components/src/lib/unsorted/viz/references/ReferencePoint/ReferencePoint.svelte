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
	export let symbolSize = 8;

	/** @type {number} */
	export let symbolOpacity = 1;

	/** @type {number | undefined} */
	export let symbolBorderWidth = undefined;

	/** @type {string | undefined} */
	export let symbolBorderColor = undefined;

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

	/** @type {number | undefined}*/
	export let fontSize = undefined;

	/** @type {'left' | 'center' | 'right' | undefined}*/
	export let align = undefined;

	/** @type {boolean | undefined} */
	export let bold = undefined;

	/** @type {boolean | undefined} */
	export let italic = undefined;

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = Query.isQuery(data) && data.hash === initialHash;

	/** @type {HTMLElement | undefined} */
	let slotElement = undefined;
	$: label = label ?? slotElement?.textContent;

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
		symbolOpacity,
		symbolBorderWidth,
		symbolBorderColor,
		labelWidth,
		labelPosition,
		labelBackground,
		labelBorderWidth,
		labelBorderRadius,
		labelBorderColor,
		labelBorderType,
		labelVisible,
		fontSize,
		align,
		bold,
		italic
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
