<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check

	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';
	import EmptyChart from '../../core/EmptyChart.svelte';
	import ErrorChart from '../../core/ErrorChart.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { getConfigContext, getPropContext } from '@evidence-dev/component-utilities/chartContext';
	import { ReferenceLineStore } from './reference-line.store.js';
	import { toBoolean, toNumber } from '../../../../utils.js';
	import { getThemeStores } from '../../../../themes.js';
	import chroma from 'chroma-js';

	const { resolveColor } = getThemeStores();

	/** @type {'pass' | 'warn' | 'error' | undefined}*/
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {number | string | undefined} */
	export let x = undefined;

	/** @type {number | string | undefined} */
	export let y = undefined;

	/** @type {number | string | undefined} */
	export let x2 = undefined;

	/** @type {number | string | undefined} */
	export let y2 = undefined;

	/** @type {unknown} */
	export let data = undefined;

	/** @type {string | undefined} */
	export let label = undefined;

	/**
	 * @type {string}
	 * @default "grey"
	 */
	export let color = 'grey';
	$: colorStore = resolveColor(color);

	/**
	 * @type {'solid' | 'dotted' | 'dashed'}
	 * @default "dashed"
	 */
	export let lineType = 'dashed';

	/** @type {string | undefined} */
	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	/**
	 * @type {number | string}
	 * @default 1.3
	 */
	export let lineWidth = 1.3;

	/**
	 * @type {boolean | string}
	 * @default false
	 */
	export let hideValue = false;

	/** @type {import('../types.js').Symbol | undefined} */
	export let symbol = undefined;

	/**
	 * @type {number | string}
	 * @default 8
	 */
	export let symbolSize = 8;

	/** @type {import('../types.js').Symbol | undefined} */
	export let symbolStart = undefined;

	/**
	 * @type {number | string}
	 * @default 8
	 */
	export let symbolStartSize = 8;

	/** @type {import('../types.js').Symbol | undefined} */
	export let symbolEnd = undefined;

	/** @type {number | string | undefined} */
	export let symbolEndSize = undefined;

	/** @type {string | undefined} */
	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	/**
	 * @type {number | string}
	 * @default 1
	 */
	export let labelPadding = 1;

	/**
	 * @type {import('./types.js').LabelPosition}
	 * @default "aboveEnd"
	 */
	export let labelPosition = 'aboveEnd';

	/** @type {string | undefined} */
	export let labelBackgroundColor = undefined;
	$: labelBackgroundColorStore = resolveColor(labelBackgroundColor);

	/** @type {number | string | undefined} */
	export let labelBorderWidth = undefined;

	/**
	 * @type {number | string}
	 * @default 1.5
	 */
	export let labelBorderRadius = 1.5;

	/** @type {string | undefined} */
	export let labelBorderColor = undefined;
	$: labelBorderColorStore = resolveColor(labelBorderColor);

	/** @type {'solid' | 'dotted' | 'dashed' | undefined} */
	export let labelBorderType = undefined;

	/** @type {number | string | undefined} */
	export let fontSize = undefined;

	/** @type {'left' | 'center' | 'right' | undefined} */
	export let align = undefined;

	/** @type {boolean | string | undefined} */
	export let bold = undefined;

	/** @type {boolean | string | undefined} */
	export let italic = undefined;

	/**
	 * @type {boolean | string}
	 * @default false
	 */
	export let preserveWhitespace = false;

	let chartType = 'Reference Line';

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

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = Query.isQuery(data) && data.hash === initialHash;

	const props = getPropContext();
	const config = getConfigContext();
	const store = new ReferenceLineStore(props, config);

	const { theme } = getThemeStores();

	// React to the props store to make sure the ReferencePoint is added after the chart is fully rendered
	$: $props,
		store.setConfig({
			x,
			y,
			x2,
			y2,
			data,
			label,
			color: $colorStore,
			symbolStart: symbolStart ?? 'none',
			symbolStartSize: toNumber(symbolStartSize),
			symbolEnd: symbolEnd ?? symbol ?? 'none',
			symbolEndSize: symbolEndSize ? toNumber(symbolEndSize) : toNumber(symbolSize),
			lineType,
			lineColor: $lineColorStore,
			lineWidth: toNumber(lineWidth),
			labelColor: $labelColorStore,
			labelPadding: toNumber(labelPadding),
			labelPosition,
			labelBackgroundColor:
				$labelBackgroundColorStore ?? chroma($theme.colors['base-100']).alpha(0.8).css(),
			labelBorderColor: $labelBorderColorStore,
			labelBorderWidth: toNumber(labelBorderWidth),
			labelBorderRadius: toNumber(labelBorderRadius),
			labelBorderType,
			hideValue: toBoolean(hideValue),
			fontSize: toNumber(fontSize),
			align,
			bold: toBoolean(bold),
			italic: toBoolean(italic)
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
		<div slot="skeleton" class="hidden"></div>
	</QueryLoad>
{/if}
