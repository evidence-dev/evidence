<!-- When adding/removing props here, make sure to change them in Callout.svelte as well -->

<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check
	import { getConfigContext, getPropContext } from '@evidence-dev/component-utilities/chartContext';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';
	import EmptyChart from '../../core/EmptyChart.svelte';
	import ErrorChart from '../../core/ErrorChart.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { createReferencePointStore } from './reference-point.store.js';
	import { toNumber } from '../../../../utils.js';

	/** @type {'pass' | 'warn' | 'error' | undefined} */
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {number | string | undefined} */
	export let x = undefined;

	/** @type {number | string | undefined} */
	export let y = undefined;

	/** @type {unknown} */
	export let data = undefined;

	/**
	 * @type {import('../colors.js').Color}
	 * @default "grey"
	 */
	export let color = 'grey';

	/** @type {string | undefined} */
	export let label = undefined;

	/** @type {import('../colors.js').Color | undefined} */
	export let labelColor = undefined;

	/**
	 * @type {number | "fit" | string | undefined}
	 * @default "fit"
	 */
	export let labelWidth = 'fit';
	$: labelWidth = labelWidth === 'fit' ? undefined : toNumber(labelWidth);

	/** @type {number | string | undefined} */
	export let labelPadding = undefined;
	$: labelPadding = toNumber(labelPadding);

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

	/** @type {'solid' | 'dotted' | 'dashed' | undefined} */
	export let labelBorderType = undefined;

	/**
	 * @type {'always' | 'hover'}
	 * @default "always"
	 */
	export let labelVisible = 'always';

	/** @type {number | string | undefined} */
	export let fontSize = undefined;
	$: fontSize = toNumber(fontSize);

	/** @type {'left' | 'center' | 'right' | undefined} */
	export let align = undefined;

	/** @type {boolean | undefined} */
	export let bold = undefined;

	/** @type {boolean | undefined} */
	export let italic = undefined;

	/**
	 * @type {import('./reference-point.d.ts').Symbol}
	 * @default "circle"
	 */
	export let symbol = 'circle';

	/** @type {import('../colors.js').Color | undefined} */
	export let symbolColor = undefined;

	/**
	 * @type {number | string}
	 * @default 8
	 */
	export let symbolSize = 8;
	$: symbolSize = toNumber(symbolSize) ?? 0;

	/** @type {number | string | undefined} */
	export let symbolOpacity = undefined;
	$: symbolOpacity = toNumber(symbolOpacity);

	/** @type {number | string | undefined} */
	export let symbolBorderWidth = undefined;
	$: symbolBorderWidth = toNumber(symbolBorderWidth);

	/** @type {string | undefined} */
	export let symbolBorderColor = undefined;

	/**
	 * @type {boolean}
	 * @default false
	 */
	export let preserveWhitespace = false;

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = Query.isQuery(data) && data.hash === initialHash;

	// Accept label from slot
	/** @type {HTMLElement | undefined} */
	let slotElement = undefined;
	$: if (slotElement?.textContent) {
		if (preserveWhitespace) {
			label = slotElement.textContent;
		} else {
			label = slotElement.textContent
				.split('\n')
				.map((line) => line.trim())
				.join('\n');
		}
	}

	// The chartType prop is only used here to allow Callout to use this component
	// chartType shouldnt be used by consumers of Evidence
	const chartType = $$props.chartType ?? 'Reference Point';

	const props = getPropContext();
	const config = getConfigContext();
	const store = createReferencePointStore(config);

	// React to the props store to make sure the ReferencePoint is added after the chart is fully rendered
	$: $props,
		($store = {
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
			labelPadding,
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
		});
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
