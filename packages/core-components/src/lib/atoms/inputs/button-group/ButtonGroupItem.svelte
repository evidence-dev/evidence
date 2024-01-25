<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getButtonGroupContext } from './lib';
	/** @type {string} */
	export let valueLabel;
	/** @type {string | boolean | number | Date} */
	export let value;

	const { update, value: currentValue } = getButtonGroupContext();
</script>

<button
	type="button"
	class="   px-2 py-1 text-sm font-medium
                                border-t border-b border-r first:border-l first:rounded-l last:rounded-r
                                hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-1 focus:ring-primary-700 focus:text-primary-700
                                {$currentValue?.value === value
		? 'z-10 border-gray-200 bg-gray-100 text-primary-700'
		: 'z-0 bg-white text-gray-900 border-gray-200'}
                                "
	on:click={() => update({ valueLabel, value })}
>
	{valueLabel}
</button>
