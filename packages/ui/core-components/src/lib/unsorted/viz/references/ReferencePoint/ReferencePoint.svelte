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
	import { getThemeStores } from '../../../../themes/themes.js';
	import chroma from 'chroma-js';
	import { checkDeprecatedColor } from '../../../../deprecated-colors.js';

	const { resolveColor } = getThemeStores();

	// The chartType prop is only used here to allow Callout to use this component
	// chartType shouldnt be used by consumers of Evidence
	const chartType = $$props.chartType ?? 'Reference Point';

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
	 * @type {string}
	 * @default "base-content-muted"
	 */
	export let color = 'base-content-muted';
	$: color = checkDeprecatedColor(chartType, 'color', color);
	$: colorStore = resolveColor(color);

	/** @type {string | undefined} */
	export let label = undefined;

	/** @type {string | undefined} */
	export let labelColor = undefined;
	$: labelColor = checkDeprecatedColor(chartType, 'labelColor', labelColor);
	$: labelColorStore = resolveColor(labelColor);

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
	$: labelBackgroundColor = checkDeprecatedColor(
		chartType,
		'labelBackgroundColor',
		labelBackgroundColor
	);
	$: labelBackgroundColorStore = resolveColor(labelBackgroundColor);

	/** @type {number | string | undefined} */
	export let labelBorderWidth = undefined;

	/** @type {number | string | undefined} */
	export let labelBorderRadius = undefined;

	/** @type {string | undefined} */
	export let labelBorderColor = undefined;
	$: labelBorderColor = checkDeprecatedColor(chartType, 'labelBorderColor', labelBorderColor);
	$: labelBorderColorStore = resolveColor(labelBorderColor);

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

	/** @type {string | undefined} */
	export let symbolColor = undefined;
	$: symbolColor = checkDeprecatedColor(chartType, 'symbolColor', symbolColor);
	$: symbolColorStore = resolveColor(symbolColor);

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
	$: symbolBorderColor = checkDeprecatedColor(chartType, 'symbolBorderColor', symbolBorderColor);
	$: symbolBorderColorStore = resolveColor(symbolBorderColor);

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

	const props = getPropContext();
	const config = getConfigContext();
	const store = new ReferencePointStore(props, config);

	const { theme } = getThemeStores();

	// React to the props store to make sure the ReferencePoint is added after the chart is fully rendered
	$: ($props,
		store.setConfig({
			data,
			x,
			y,
			label,
			symbol,
			color: $colorStore,
			labelColor: $labelColorStore,
			symbolColor: $symbolColorStore,
			symbolSize: toNumber(symbolSize),
			symbolOpacity: toNumber(symbolOpacity),
			symbolBorderWidth: toNumber(symbolBorderWidth),
			symbolBorderColor: $symbolBorderColorStore,
			labelWidth: labelWidth === 'fit' ? undefined : toNumber(labelWidth),
			labelPadding: toNumber(labelPadding),
			labelPosition,
			labelBackgroundColor:
				$labelBackgroundColorStore ?? chroma($theme.colors['base-100']).alpha(0.8).css(),
			labelBorderWidth: toNumber(labelBorderWidth),
			labelBorderRadius: toNumber(labelBorderRadius),
			labelBorderColor: $labelBorderColorStore,
			labelBorderType,
			fontSize: toNumber(fontSize),
			align,
			bold,
			italic
		}));
</script>

{#if $$slots.default}
	<div class="invisible" bind:this={slotElement}>
		<slot />
	</div>
{/if}

{#if $store.error}
	<ErrorChart error={$store.error} height="50" title={chartType} />
{:else}
	<QueryLoad {data}>
		<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
		<ErrorChart let:loaded slot="error" title={chartType} error={loaded.error.message} />
		<div slot="skeleton" class="hidden"></div>
	</QueryLoad>
{/if}
