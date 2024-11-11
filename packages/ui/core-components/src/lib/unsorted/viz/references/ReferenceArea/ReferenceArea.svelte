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
	 * @type {import('../types.js').PresetColor}
	 * @default "blue"
	 */
	export let color = 'blue';

	/** @type {import('../types.js').PresetColor | undefined} */
	export let areaColor = undefined;

	/** @type {number | string} */
	export let opacity = 1;

	/** @type {boolean | string} */
	export let border = false;

	/** @type {'solid' | 'dotted' | 'dashed'} */
	export let borderType = 'dashed';

	/** @type {import('../types.js').PresetColor | undefined}*/
	export let borderColor = undefined;

	/** @type {number | string | undefined} */
	export let borderWidth = undefined;

	/** @type {import('../types.js').PresetColor | undefined} */
	export let labelColor = undefined;

	/**
	 * @type {number | string}
	 * @default 1
	 */
	export let labelPadding = 1;

	/** @type {import('./types.js').LabelPosition | undefined} */
	export let labelPosition = undefined;

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
			color,
			areaColor,
			opacity: toNumber(opacity),
			border: toBoolean(border),
			borderType,
			borderColor,
			borderWidth: toNumber(borderWidth),
			labelColor,
			labelPadding: toNumber(labelPadding),
			labelPosition,
			labelBackgroundColor,
			labelBorderColor,
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
		<div slot="skeleton" class="invisible"></div>
	</QueryLoad>
{/if}
