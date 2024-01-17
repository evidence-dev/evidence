<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, setContext } from 'svelte';
	import { page } from '$app/stores';
	import DropdownOption from './DropdownOption.svelte';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {string} */
	export let defaultValue = null;

	setContext('dropdown_context', {
		defaultValue: defaultValue,
		hasBeenSet: false,
		setSelectedValue: (selected) => ($inputs[name] = selected)
	});

	/////
	// Query-Related Things
	/////

	export let value, data, label, order, where;
	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`Dropdown-${name}`,
		$page.data.data[`Dropdown-${name}`]
	);
	$: update({ value, data, label, order, where });
	$: ({ hasQuery, query } = $results);
</script>

<div class="mt-2 mb-4 mx-1 inline-block">
	{#if title}
		<span class="text-sm text-gray-500 block">{title}</span>
	{/if}

	{#if hasQuery && $query.error}
		<span
			class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-red-200 py-[1px] bg-red-50 rounded"
		>
			<span class="inline font-sans font-medium text-xs text-red-600">error</span>
			<span
				class="hidden text-white font-sans group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-gray-800/80 leading-relaxed min-w-[150px] w-max max-w-[400px] rounded-md"
			>
				{$query.error}
			</span>
		</span>
	{:else}
		<pre class="text-xs overflow-x-auto w-full">{$query.text}</pre>
		<select
			disabled={hasQuery && !$query.loaded}
			bind:value={$inputs[name]}
			class="border border-gray-300 bg-white rounded-lg p-1 mt-2 px-2 pr-5 flex flex-row items-center max-w-fit bg-transparent cursor-pointer bg-right bg-no-repeat"
			style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' class=\'icon icon-tabler icon-tabler-chevron-down\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' stroke-width=\'2\' stroke=\'currentColor\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath stroke=\'none\' d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M6 9l6 6l6 -6\' /%3E%3C/svg%3E');"
		>
			<slot />

			{#each $query ?? [] as row (row.value)}
				<DropdownOption value={row.value} valueLabel={row.label} />
			{/each}
		</select>
	{/if}
</div>
