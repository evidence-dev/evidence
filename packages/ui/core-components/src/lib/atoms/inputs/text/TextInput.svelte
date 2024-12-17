<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
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

	/** @type {boolean} */
	export let unsafe = false;
	$: unsafe = unsafe === true || unsafe === 'true';

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
	<div class="mt-2 mb-4 ml-0 mr-2 inline-block">
		{#if title}
			<span class="text-sm block mb-1">{title}</span>
		{/if}
		<input
			bind:value
			class="font-medium border border-base-300 bg-base-100 p-1 mt-2 pr-5 h-8 rounded-md px-3 sm:text-xs flex flex-row items-center max-w-fit bg-transparent cursor-text bg-right bg-no-repeat focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-content-muted shadow-sm text-base"
			{placeholder}
		/>
	</div>
</HiddenInPrint>
