<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	import debounce from 'lodash.debounce'
	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

    /**
     * @param {string} v
     */
    const updateValue = debounce((v) => {
        $inputs[name] = {
            toString() { return v },
            sql: `'${v}'`,
            search: (col) => `damerau_levenshtein(${col}, '${v}')`
        }
    }, 100)

	let tempValue = ""
	updateValue(tempValue)

	$: updateValue(tempValue)
</script>

<div class="mt-2 mb-4 mx-1 inline-block">
	{#if title}
		<span class="text-sm text-gray-500 block">{title}</span>
	{/if}
		<input
			bind:value={tempValue}
			class="border border-gray-300 bg-white rounded-lg p-1 mt-2 px-2 pr-5 flex flex-row items-center max-w-fit bg-transparent cursor-text bg-right bg-no-repeat"
		/>
</div>
