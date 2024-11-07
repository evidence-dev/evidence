<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();
	import SliderShadcn from '../../shadcn/slider/sliderShadcn.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { toNumber } from '$lib/utils.js';

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {number|undefined} */
	export let min = 0;

	if (min) {
		// if min was user-supplied
		min = Number(min);
		if (isNaN(min)) {
			// input must be a number
			throw Error('min must be a number');
		}
	} else {
		min = 0;
	}

	/** @type {number} */
	export let max = 100;

	if (max) {
		// if min was user-supplied
		max = Number(max);
		if (isNaN(max)) {
			// input must be a number
			throw Error('max must be a number');
		} else if (max < min) {
			throw Error('max cannot be less than min');
		}
	} else {
		max = 100;
	}

	/** @type {number} */
	export let step;

	/** @type {boolean} */
	export let showMaxMin = true;
	$: showMaxMin = showMaxMin === 'true' || showMaxMin === true;

	/** @type {boolean} */
	export let hideDuringPrint = true;
	$: hideDuringPrint = hideDuringPrint === 'true' || hideDuringPrint === true;

	/** @type {number | string} */
	export let defaultValue = 0;

	/** @type {[number]} */
	let value = [0];

	if (typeof defaultValue === 'number') {
		value = [defaultValue];
	} else if (toNumber(defaultValue)) {
		value = [toNumber(defaultValue)];
	}

	/** @type {string | undefined} */
	export let fmt = undefined;

	$: $inputs[name] = value;

	/** @type {string} */
	export let size = '';

	const renderSize = (size) => {
		const sizeMap = {
			medium: 'w-64',
			large: 'w-96',
			//Full size width requires calc to compensate for shifted range span in sliderShadcn
			full: 'w-[calc(100%-0.6rem)]'
		};
		return sizeMap[size.toLowerCase()] || 'w-40';
	};

	$: sizeClass = renderSize(size);

	let format_object;
	if (fmt) format_object = getFormatObjectFromString(fmt, 'number');
	else format_object = undefined;

	export let data = null;

	let error;

	let strictBuild;

	export let maxColumn = undefined;
	export let minColumn = undefined;

	let initialized = false;

	if (!initialized) {
		try {
			error = undefined;
			if (data) {
				if (typeof data == 'string') {
					throw Error(`Received: data=${data}, expected: data={${data}}`);
				}

				if (!Array.isArray(data)) {
					// Accept bare objects
					data = [data];
				}

				if (maxColumn && data[0]?.[maxColumn]) {
					max = data[0][maxColumn];
				}

				if (minColumn && data[0]?.[minColumn]) {
					min = data[0][minColumn];
				}

				// Only set value on initial mount
				if (typeof defaultValue === 'string' && data[0]?.[defaultValue]) {
					value = [data[0][defaultValue]];
				}
				initialized = true;
			} else if (maxColumn || minColumn) {
				throw Error(
					'No data provided. If you referenced a query result, check that the name is correct.'
				);
			}
		} catch (e) {
			error = e.message;
			const setTextRed = '\x1b[31m%s\x1b[0m';
			console.error(setTextRed, `Error in Value: ${error}`);
			if (strictBuild) {
				throw error;
			}
		}
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class={`relative ${sizeClass} mb-10 select-none`}>
		<p class="pb-2 truncate text-xs">
			{title} :
			<span class="text-xs">{fmt ? formatValue($inputs[name], format_object) : $inputs[name]}</span>
		</p>
		<SliderShadcn {min} {max} {step} {sizeClass} bind:value />
		{#if showMaxMin}
			<span class="absolute left-0 text-xs pt-1 -z-10"
				>{fmt ? formatValue(min, format_object) : min}</span
			>
			<span class="absolute -right-2.5 text-xs pt-1 -z-10"
				>{fmt ? formatValue(max, format_object) : max}</span
			>
		{/if}
	</div>
</HiddenInPrint>
