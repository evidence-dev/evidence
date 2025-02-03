<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Button from '../../shadcn/button/button.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import Info from '../../../unsorted/ui/Info.svelte';
	import { toBoolean } from '../../../utils.js';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import InlineError from '../InlineError.svelte';
	import checkRequiredProps from '../checkRequiredProps.js';
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
	$: hideDuringPrint = toBoolean(hideDuringPrint);

	/** @type {boolean} */
	export let checked = false;

	/** @type {boolean | string} */
	export let defaultValue = false;
	$: defaultValue = toBoolean(defaultValue);

	if (defaultValue !== undefined) {
		console.warn('`defaultValue` is deprecated. Please use the `checked` prop instead.');
	}

	let isChecked = toBoolean(defaultValue) || toBoolean(checked);

	$: $inputs[name] = isChecked;

	// Error Handling
	/** @type {[string]} */
	let errors = [];

	try {
		checkRequiredProps({ name });
	} catch (err) {
		errors.push(err.message);
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	{#if errors.length > 0}
		<InlineError inputType="Checkbox" error={errors} height="32" width="160" />
	{:else}
		<Button
			type="button"
			on:click={() => (isChecked = !isChecked)}
			variant="outline"
			size="sm"
			class="min-w-40 inline-flex justify-between gap-4 items-center w-full max-w-fit mt-2 mb-4 mr-2 {title
				? ''
				: 'min-w-10'}"
		>
			{#if title}
				<p class="truncate font-medium">
					{title}
					{#if description}
						<Info {description} />
					{/if}
				</p>
			{/if}
			<input
				type="checkbox"
				bind:checked={isChecked}
				class="[&:not(:checked)]:appearance-none cursor-pointer border border-base-content-muted rounded-sm focus-visible:outline-none h-3 w-3 focus-visible:ring-1 focus-visible:ring-base-300 shadow-sm accent-primary"
			/>
		</Button>
	{/if}
</HiddenInPrint>
