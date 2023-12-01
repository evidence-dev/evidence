<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, setContext } from 'svelte';
	import DropdownOption from './DropdownOption.svelte';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/////
	// Component Things
	/////

	/** @type {string} */
	export let label;

	/** @type {string} */
	export let name;

	setContext('dropdown_context', {
		hasBeenSet: false,
		setSelectedValue: (selected) => ($inputs[name] = selected)
	});

	/////
	// Query-Related Things
	/////

	export let value, data, value_label, order, where;
	/** @type {import("@evidence-dev/component-utilities/buildQuery.js").QueryProps}*/
	$: ({ hasQuery, query } = buildInputQuery(
		{ value, data, label: value_label, order, where },
		`Dropdown-${name}`
	));
</script>

{#if label}
	<span class="text-sm text-gray-500 block">{label}</span>
{/if}

<!--
	do not switch to binding, select bind:value invalidates its dependencies 
	(so `data` would be invalidated) 
-->
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
	<select
		disabled={hasQuery && !$query.loaded}
		on:change={(e) => ($inputs[name] = e.currentTarget.value)}
	>
		<slot />

		{#if hasQuery}
			{#each $query as { label, value }}
				<DropdownOption {value} {label} />
			{/each}
		{/if}
	</select>
{/if}
