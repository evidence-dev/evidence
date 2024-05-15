<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {Number} */
	export let max;

	/** @type {Number} */
	export let min;

	/** @type {Number} */
	export let steps;

	/** @type {boolean} */
	export let hideDuringPrint = true;

	export let defaultValue = undefined;

	$inputs[name] = defaultValue;
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 ml-0 mr-2 inline-block">
		<div class="flex items-center justify-between w-40">
			<span class="text-gray-900 text-sm block mb-1">{title}</span>
			<input
				{min}
				{max}
				step={steps}
				type="range"
				bind:value={$inputs[name]}
				class="font-medium border bg-white ml-2 h-8 rounded-md sm:text-xs flex flex-row items-center max-w-fit bg-transparent bg-right bg-no-repeat focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 shadow-sm text-base"
			/>
		</div>
	</div>
</HiddenInPrint>
