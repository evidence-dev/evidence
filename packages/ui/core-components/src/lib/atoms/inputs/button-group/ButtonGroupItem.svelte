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

	/** @type {boolean} */
	let _default = false;
	export { _default as default };

	if (_default) {
		update({ valueLabel, value });
	}
</script>

<button
	type="button"
	class="flex-none py-1 font-medium h-8 px-3 text-xs truncate
                                border-r last:border-none
                                hover:bg-secondary focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
                                {$currentValue?.value === value
		? 'z-10 border-border bg-secondary text-primary'
		: 'z-0 bg-background text-foreground border-border'}
                                dark:hover:bg-secondary
                                "
	on:click={() => update({ valueLabel, value })}
>
	{valueLabel}
</button>
