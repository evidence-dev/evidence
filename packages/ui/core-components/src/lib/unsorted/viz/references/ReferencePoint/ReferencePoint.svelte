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
	import { toNumber } from '../../../../utils.js';

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

	/**
	 * @type {import('./reference-point.d.ts').Symbol}
	 * @default "circle"
	 */
	export let symbol = 'circle';

	/**
	 * @type {number | string}
	 * @default 8
	 */
	export let symbolSize = 8;
	$: symbolSize = toNumber(symbolSize);

	/** @type {number | string | undefined} */
	export let symbolOpacity = undefined;
	$: symbolOpacity = toNumber(symbolOpacity);

	/** @type {number | string | undefined} */
	export let symbolBorderWidth = undefined;
	$: symbolBorderWidth = toNumber(symbolBorderWidth);

	/** @type {string | undefined} */
	export let symbolBorderColor = undefined;

	/**
	 * @type {import('../colors.js').Color}
	 * @default "gray"
	 */
	export let color = 'gray';

	/** @type {import('../colors.js').Color | undefined} */
	export let labelColor = undefined;

	/** @type {import('../colors.js').Color | undefined} */
	export let symbolColor = undefined;

	/** @type {number | string | undefined} */
	export let labelWidth = undefined;
	$: labelWidth = toNumber(labelWidth);

	/**
	 * @type {import('./reference-point.d.ts').LabelPosition}
	 * @default "top"
	 */
	export let labelPosition = 'top';

	/**
	 * @type {string}
	 * @default "hsla(360, 100%, 100%, 0.7)"
	 */
	export let labelBackgroundColor = 'hsla(360, 100%, 100%, 0.7)';

	/** @type {number | string | undefined} */
	export let labelBorderWidth = undefined;
	$: labelBorderWidth = toNumber(labelBorderWidth);

	/** @type {number | string | undefined} */
	export let labelBorderRadius = undefined;
	$: labelBorderRadius = toNumber(labelBorderRadius);

	/** @type {string | undefined} */
	export let labelBorderColor = undefined;

	/** @type {'solid' | 'dotted' | 'dashed' | undefined}*/
	export let labelBorderType = undefined;

	/**
	 * @type {'always' | 'hover'}
	 * @default "always"
	 */
	export let labelVisible = 'always';

	/** @type {number | string | undefined}*/
	export let fontSize = undefined;
	$: fontSize = toNumber(fontSize);

	/** @type {'left' | 'center' | 'right' | undefined} */
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
		labelBackgroundColor,
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
