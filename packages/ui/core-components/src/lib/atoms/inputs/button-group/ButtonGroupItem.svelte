<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getButtonGroupContext } from './lib.js';
	import { getContext } from 'svelte';
	import { inputValuesMatch } from '../inputValue.js';
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

	// `defaultValue` comes from markdown and is therefore always a string, while
	// `value` keeps the type it had in the query (number / bigint / Date). Compare
	// them by value, otherwise the default never applies and every query using this
	// input stays unset -- i.e. loading forever.
	if (defaultValue !== undefined && inputValuesMatch(defaultValue, value)) {
		update({ valueLabel, value });
	}
</script>

{#if display === 'tabs'}
	<TabDisplay
		id={value}
		label={valueLabel}
		color={colorStore}
		on:click={() => update({ valueLabel, value })}
		activeId={inputValuesMatch($currentValue?.value, value) ? value : $currentValue?.value}
	/>
{:else if display === 'buttons'}
	<button
		type="button"
		class="flex-none py-1 font-medium px-3 text-xs truncate
		border-r last:border-none border-base-300
		hover:bg-base-200 focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-300
		{inputValuesMatch($currentValue?.value, value)
			? 'z-10 bg-base-200 text-primary'
			: 'z-0 bg-base-100'}"
		on:click={() => update({ valueLabel, value })}
	>
		{valueLabel}
	</button>
{/if}
