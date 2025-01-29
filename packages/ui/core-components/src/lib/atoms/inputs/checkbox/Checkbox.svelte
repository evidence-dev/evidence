<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Button from '../../shadcn/button/button.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import Info from '../../../unsorted/ui/Info.svelte';
	import { toBoolean } from '../../../utils.js';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {string | undefined} */
	export let description;

	/** @type {boolean} */
	export let hideDuringPrint = true;
	$: hideDuringPrint = hideDuringPrint === 'true' || hideDuringPrint === true;

	export let defaultValue = false;

	$: $inputs[name] = toBoolean(defaultValue);
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<Button
		type="button"
		on:click={() => ($inputs[name] = !$inputs[name])}
		variant="outline"
		size="sm"
		class="min-w-40 inline-flex justify-between gap-4 items-center w-full max-w-fit mt-2 mb-4 mr-2"
	>
		<p class="truncate font-medium">
			{title}
			{#if description}
				<Info {description} />
			{/if}
		</p>
		<input
			type="checkbox"
			bind:checked={$inputs[name]}
			class="[&:not(:checked)]:appearance-none cursor-pointer border border-base-content-muted rounded-xs focus-visible:outline-none h-3 w-3 focus-visible:ring-1 focus-visible:ring-base-300 shadow-sm accent-primary"
		/>
	</Button>
</HiddenInPrint>
