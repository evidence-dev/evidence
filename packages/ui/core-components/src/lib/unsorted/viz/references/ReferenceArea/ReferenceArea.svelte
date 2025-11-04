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
	import { checkDeprecatedColor } from '../../../../deprecated-colors.js';

	const { activeAppearance, resolveColor } = getThemeStores();

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
	 * @default "info"
	 */
	export let color = 'info';
	$: color = checkDeprecatedColor('ReferenceArea', 'color', color);
	$: colorStore = resolveColor(color);

	/** @type {string | undefined} */
	export let areaColor = undefined;
	$: areaColor = checkDeprecatedColor('ReferenceArea', 'areaColor', areaColor);
	$: areaColorStore = resolveColor(areaColor);

	/** @type {number | string} */
	export let opacity = 1;

	/** @type {boolean | string} */
	export let border = false;

	/** @type {'solid' | 'dotted' | 'dashed'} */
	export let borderType = 'dashed';

	/** @type {string | undefined} */
	export let borderColor = undefined;
	$: borderColor = checkDeprecatedColor('ReferenceArea', 'borderColor', borderColor);
	$: borderColorStore = resolveColor(borderColor);

	/** @type {number | string | undefined} */
	export let borderWidth = undefined;

	/** @type {string | undefined} */
	export let labelColor = undefined;
	$: labelColor = checkDeprecatedColor('ReferenceArea', 'labelColor', labelColor);
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
	$: labelBackgroundColor = checkDeprecatedColor(
		'ReferenceArea',
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
	$: labelBorderColor = checkDeprecatedColor('ReferenceArea', 'labelBorderColor', labelBorderColor);
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
	$: ($props,
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
			italic: toBoolean(italic),
			activeAppearance: $activeAppearance
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
