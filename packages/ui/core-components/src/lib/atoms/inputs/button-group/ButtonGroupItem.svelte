<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getButtonGroupContext } from './lib.js';
	/** @type {string} */
	export let valueLabel;
	/** @type {string | boolean | number | Date} */
	export let value;

	const { update, value: currentValue } = getButtonGroupContext();
</script>

<button
	type="button"
	class="   py-1 font-medium h-8 px-3 text-xs truncate
                                border-t border-b border-r first:border-l first:rounded-l-md last:rounded-r-md
                                hover:bg-gray-100 focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400
                                {$currentValue?.value === value
		? 'z-10 border-gray-200 bg-gray-100 text-blue-700'
		: 'z-0 bg-white text-gray-900 border-gray-200'}
                                "
	on:click={() => update({ valueLabel, value })}
>
	{valueLabel}
</button>
