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
	import { ReferenceAreaStore } from './reference-area.store.js';
	import { toBoolean, toNumber } from '../../../../utils.js';
	import { getThemeStores } from '../../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	/** @type {'pass' | 'warn' | 'error' | undefined}*/
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {number | string | undefined} */
	export let xMin = undefined;
	/** @type {number | string | undefined} */
	export let xMax = undefined;

	/** @type {number | string | undefined} */
	export let yMin = undefined;

	/** @type {number | string | undefined} */
	export let yMax = undefined;

	/** @type {unknown} */
	export let data = undefined;

	/** @type {string | undefined} */
	export let label = undefined;

	/**
	 * @type {string}
	 * @default "blue"
	 */
	export let color = 'blue';
	$: colorStore = resolveColor(color);

	/** @type {string | undefined} */
	export let areaColor = undefined;
	$: areaColorStore = resolveColor(areaColor);

	/** @type {number | string} */
	export let opacity = 1;

	/** @type {boolean | string} */
	export let border = false;

	/** @type {'solid' | 'dotted' | 'dashed'} */
	export let borderType = 'dashed';

	/** @type {string | undefined}*/
	export let borderColor = undefined;
	$: borderColorStore = resolveColor(borderColor);

	/** @type {number | string | undefined} */
	export let borderWidth = undefined;

	/** @type {string | undefined} */
	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	/**
	 * @type {number | string}
	 * @default 1
	 */
	export let labelPadding = 1;

	/** @type {import('./types.js').LabelPosition | undefined} */
	export let labelPosition = undefined;

	/** @type {string | undefined} */
	export let labelBackgroundColor = undefined;
	$: labelBackgroundColorStore = resolveColor(labelBackgroundColor);

	/** @type {number | string | undefined} */
	export let labelBorderWidth = undefined;

	/** @type {number | string | undefined} */
	export let labelBorderRadius = undefined;

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

	let chartType = 'Reference Area';

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
	const store = new ReferenceAreaStore(props, config);

	// React to the props store to make sure the ReferencePoint is added after the chart is fully rendered
	$: $props,
		store.setConfig({
			xMin,
			xMax,
			yMin,
			yMax,
			data,
			label,
			color: $colorStore,
			areaColor: $areaColorStore,
			opacity: toNumber(opacity),
			border: toBoolean(border),
			borderType,
			borderColor: $borderColorStore,
			borderWidth: toNumber(borderWidth),
			labelColor: $labelColorStore,
			labelPadding: toNumber(labelPadding),
			labelPosition,
			labelBackgroundColor: $labelBackgroundColorStore,
			labelBorderColor: $labelBorderColorStore,
			labelBorderWidth: toNumber(labelBorderWidth),
			labelBorderRadius: toNumber(labelBorderRadius),
			labelBorderType,
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
