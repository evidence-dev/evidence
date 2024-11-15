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
	import { ensureThemeStores } from '../../../../themes.js';
	import chroma from 'chroma-js';

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
	 * @type {import('../types.js').ReferenceColor}
	 * @default "grey"
	 */
	export let color = 'grey';

	/**
	 * @type {'solid' | 'dotted' | 'dashed'}
	 * @default "dashed"
	 */
	export let lineType = 'dashed';

	/** @type {import('../types.js').ReferenceColor | undefined} */
	export let lineColor = undefined;

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

	/** @type {import('../types.js').ReferenceColor | undefined} */
	export let labelColor = undefined;

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

	/** @type {number | string | undefined} */
	export let labelBorderWidth = undefined;

	/**
	 * @type {number | string}
	 * @default 1.5
	 */
	export let labelBorderRadius = 1.5;

	/** @type {string | undefined} */
	export let labelBorderColor = undefined;

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

	const { theme } = ensureThemeStores();

	// React to the props store to make sure the ReferencePoint is added after the chart is fully rendered
	$: $props,
		store.setConfig({
			x,
			y,
			x2,
			y2,
			data,
			label,
			color,
			symbolStart: symbolStart ?? 'none',
			symbolStartSize: toNumber(symbolStartSize),
			symbolEnd: symbolEnd ?? symbol ?? 'none',
			symbolEndSize: symbolEndSize ? toNumber(symbolEndSize) : toNumber(symbolSize),
			lineType,
			lineColor,
			lineWidth: toNumber(lineWidth),
			labelColor,
			labelPadding: toNumber(labelPadding),
			labelPosition,
			labelBackgroundColor:
				labelBackgroundColor ?? chroma($theme.colors['base-100']).alpha(0.8).css(),
			labelBorderColor,
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
