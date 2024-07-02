<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	import Button from '../../shadcn/button/button.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {boolean} */
	export let hideDuringPrint = true;
	$: hideDuringPrint = hideDuringPrint === 'true' || hideDuringPrint === true;

	export let defaultValue = false;
	$: defaultValue = defaultValue === 'true' || defaultValue === true;

	$inputs[name] = defaultValue;
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<Button
		type="button"
		on:click={() => ($inputs[name] = !$inputs[name])}
		variant="outline"
		size="sm"
		class="min-w-40 inline-flex justify-between gap-4 items-center w-full max-w-fit mb-2"
	>
		<p class="truncate font-medium">
			{title}
		</p>
		<div>
			<input
				type="checkbox"
				bind:checked={$inputs[name]}
				class="focus-visible:outline-none h-3 w-3 focus-visible:ring-1 focus-visible:ring-gray-400 shadow-sm accent-gray-700"
			/>
		</div>
	</Button>
</HiddenInPrint>
