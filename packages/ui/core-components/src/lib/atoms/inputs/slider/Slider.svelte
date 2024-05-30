<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	const inputs = getContext(INPUTS_CONTEXT_KEY);
	import SliderShadcn from '../../shadcn/slider/sliderShadcn.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';

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

	/** @type {number} */
	export let defaultValue = 0;

	/** @type {[number]} */
	let value = [defaultValue];

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
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class={`relative ${sizeClass} mb-10 select-none`}>
		<p class="pb-2 truncate text-xs">
			{title} : <span class="text-xs">{$inputs[name]}</span>
		</p>
		<SliderShadcn {min} {max} {step} {sizeClass} bind:value />
		{#if showMaxMin}
			<span class="absolute left-0 text-xs pt-1 -z-10">{min}</span>
			<span class="absolute -right-2.5 text-xs pt-1 -z-10">{max}</span>
		{/if}
	</div>
</HiddenInPrint>
