<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getButtonGroupContext } from './lib.js';
	import { getContext } from 'svelte';
	/** @type {string} */
	import TabDisplay from '../../../unsorted/ui/Tabs/TabDisplay.svelte';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	export let valueLabel;

	/** @type {string | boolean | number | Date} */
	export let value;

	export let color = 'hsla(207, 65%, 39%, 1)';
	$: colorStore = resolveColor(color);

	/** @type {string} */
	export let defaultValue;

	let display = getContext('button-display');

	const { update, value: currentValue } = getButtonGroupContext();

	/** @type {boolean} */
	let _default = false;
	export { _default as default };

	if (_default) {
		update({ valueLabel, value });
	}

	if (defaultValue === value) {
		update({ valueLabel, value });
	}
</script>

{#if display === 'tabs'}
	<TabDisplay
		id={value}
		label={valueLabel}
		color={$colorStore}
		on:click={() => update({ valueLabel, value })}
		activeId={$currentValue?.value}
	/>
{:else if display === 'buttons'}
	<button
		type="button"
		class="flex-none py-1 font-medium h-8 px-3 text-xs truncate
		border-r last:border-none border-base-300
		hover:bg-base-200 focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-300
		{$currentValue?.value === value ? 'z-10 bg-base-200 text-primary' : 'z-0 bg-base-100'}"
		on:click={() => update({ valueLabel, value })}
	>
		{valueLabel}
	</button>
{/if}
