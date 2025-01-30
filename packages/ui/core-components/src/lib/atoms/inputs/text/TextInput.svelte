<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import Info from '../../../unsorted/ui/Info.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { toBoolean } from '$lib/utils.js';
	const inputs = getInputContext();

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {boolean} */
	export let hideDuringPrint = true;

	/** @type {string} */
	export let placeholder = 'Type to search';

	/** @type {string | undefined} */
	export let defaultValue = undefined;

	/** @type {string | undefined} */
	export let description = undefined;

	/** @type {boolean} */
	export let unsafe = false;
	$: unsafe = toBoolean(unsafe);

	let touched = false;

	const setInputStore = () => {
		let sqlString = value;
		if (!unsafe) sqlString = sqlString.replaceAll("'", "''");
		$inputs[name] = {
			toString() {
				return sqlString;
			},
			sql: `'${sqlString}'`,
			search: (col) => `damerau_levenshtein(${col}, '${sqlString}')`
		};
	};

	$: {
		if (value) touched = true;
		if (touched) {
			setInputStore();
		}
	}

	let value = defaultValue;
	if (typeof defaultValue !== 'undefined') {
		setInputStore();
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class={`${title ? '-mt-0.5' : 'mt-2'} mb-4 ml-0 mr-2 inline-block align-bottom`}>
		{#if title}
			<span class="text-xs font-medium block mb-0.5"
				>{title}
				{#if description}
					<Info {description} />
				{/if}
			</span>
		{/if}
		<input
			bind:value
			class="font-medium border pb-1 pt-[3px] h-8 border-base-300 bg-base-100 pr-3 rounded-md px-2 sm:text-xs max-w-fit bg-transparent cursor-text bg-right bg-no-repeat focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-content-muted shadow-sm text-base placeholder:font-normal placeholder:text-base-content-muted/80"
			{placeholder}
		/>
	</div>
</HiddenInPrint>
