<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
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

	/** @type {string} */
	export let placeholder = 'Type to search';

	/** @type {string} */
	export let defaultValue = '';

	/** @type {boolean} */
	export let unsafe = false;
	$: unsafe = unsafe === true || unsafe === 'true';

	$: {
		let sqlString = value;
		if (!unsafe) sqlString = sqlString.replaceAll("'", "''");
		$inputs[name] = {
			toString() {
				return sqlString;
			},
			sql: `'${sqlString}'`,
			search: (col) => `damerau_levenshtein(${col}, '${sqlString}')`
		};
	}

	let value = defaultValue;
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 mx-1 inline-block">
		{#if title}
			<span class="text-sm text-gray-500 block">{title}</span>
		{/if}
		<input
			bind:value
			class="border border-gray-300 bg-white rounded-lg p-1 mt-2 px-2 pr-5 flex flex-row items-center max-w-fit bg-transparent cursor-text bg-right bg-no-repeat"
			{placeholder}
		/>
	</div>
</HiddenInPrint>
