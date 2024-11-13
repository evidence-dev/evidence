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
	import { ReferencePointStore } from './reference-point.store.js';
	import { toNumber } from '../../../../utils.js';
	import { getThemeStores } from '../../../../themes.js';
	import chroma from 'chroma-js';

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
	 * @type {import('../types.js').ReferenceColor}
	 * @default "grey"
	 */
	export let color = 'grey';

	/** @type {string | undefined} */
	export let label = undefined;

	/** @type {import('../types.js').ReferenceColor | undefined} */
	export let labelColor = undefined;

	/**
	 * @type {number | "fit" | string | undefined}
	 * @default "fit"
	 */
	export let labelWidth = 'fit';

	/** @type {number | string | undefined} */
	export let labelPadding = undefined;

	/**
	 * @type {import('./types.js').LabelPosition}
	 * @default "top"
	 */
	export let labelPosition = 'top';

	/** @type {string | undefined} */
	export let labelBackgroundColor = undefined;

	/** @type {number | string | undefined} */
	export let labelBorderWidth = undefined;

	/** @type {number | string | undefined} */
	export let labelBorderRadius = undefined;

	/** @type {string | undefined} */
	export let labelBorderColor = undefined;

	/** @type {'solid' | 'dotted' | 'dashed' | undefined} */
	export let labelBorderType = undefined;

	/** @type {number | string | undefined} */
	export let fontSize = undefined;

	/** @type {'left' | 'center' | 'right' | undefined} */
	export let align = undefined;

	/** @type {boolean | undefined} */
	export let bold = undefined;

	/** @type {boolean | undefined} */
	export let italic = undefined;

	/**
	 * @type {import('../types.js').Symbol}
	 * @default "circle"
	 */
	export let symbol = 'circle';

	/** @type {import('../types.js').ReferenceColor | undefined} */
	export let symbolColor = undefined;

	/**
	 * @type {number | string}
	 * @default 8
	 */
	export let symbolSize = 8;

	/** @type {number | string | undefined} */
	export let symbolOpacity = undefined;

	/** @type {number | string | undefined} */
	export let symbolBorderWidth = undefined;

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
	const store = new ReferencePointStore(props, config);

	const { theme } = getThemeStores();

	// React to the props store to make sure the ReferencePoint is added after the chart is fully rendered
	$: $props,
		store.setConfig({
			data,
			x,
			y,
			label,
			symbol,
			color,
			labelColor,
			symbolColor,
			symbolSize: toNumber(symbolSize),
			symbolOpacity: toNumber(symbolOpacity),
			symbolBorderWidth: toNumber(symbolBorderWidth),
			symbolBorderColor,
			labelWidth: labelWidth === 'fit' ? undefined : toNumber(labelWidth),
			labelPadding: toNumber(labelPadding),
			labelPosition,
			labelBackgroundColor:
				labelBackgroundColor ?? chroma($theme.colors['base-100']).alpha(0.8).css(),
			labelBorderWidth: toNumber(labelBorderWidth),
			labelBorderRadius: toNumber(labelBorderRadius),
			labelBorderColor,
			labelBorderType,
			fontSize: toNumber(fontSize),
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
