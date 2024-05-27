<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Slider from '../../shadcn/slider/slider.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	const inputs = getContext(INPUTS_CONTEXT_KEY);
	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {number} */
	export let min;

	/** @type {number} */
	export let max;

	/** @type {number} */
	export let step;

	/** @type {boolean} */
	export let showMaxMin = true;

	/** @type {boolean} */
	export let hideDuringPrint = true;
	$: hideDuringPrint = hideDuringPrint === 'true' || hideDuringPrint === true;

	/** @type {number} */
	export let defaultValue = 0;

	/** @type {[number]} */
	let value = [defaultValue];

	$inputs[name] = value;

	/** @type {string} */
	export let size = '';

	const renderSize = (size) => {
		const sizeMap = {
			medium: 'w-64',
			large: 'w-96'
		};
		return sizeMap[size.toLowerCase()] || 'w-40';
	};

	$: sizeClass = renderSize(size);
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class={`relative ${sizeClass}`}>
		<Slider {min} {max} {step} bind:value={$inputs[name]}>{value}</Slider>
		{#if showMaxMin}
			<span class="absolute left-0 text-xs pt-1">{min}</span>
			<span class="absolute right-0 text-xs pt-1">{max}</span>
		{/if}
		<span class="absolute -right-9 -top-3 text-right">{$inputs[name]}</span>
	</div>
</HiddenInPrint>
