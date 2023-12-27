<script>
	import { setButtonGroupContext } from './lib';
	import { derived, writable } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	import { buildInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { page } from '$app/stores';
	/** @type {string} */
	export let name;
	/** @type {string} */
	export let title;

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	let currentValue = null;
	const valueStore = writable(null);
	$: valueStore.update(() => currentValue);
	$: $inputs[name] = currentValue?.value ?? null;

	setButtonGroupContext(
		(v) => (currentValue = v),
		derived([valueStore], ([$v]) => $v)
	);

	/////
	// Query-Related Things
	/////

	export let value, data, label, order, where;
	/** @type {import("@evidence-dev/component-utilities/buildQuery.js").QueryProps} */
	$: ({ hasQuery, query } = buildInputQuery(
		{ value, data, label, order, where },
		`ButtonGroup-${name}`,
		$page?.data?.data[`ButtonGroup-${name}`]
	));
</script>

<div class="inline-flex flex-col">
	{#if title}
		<span class="text-gray-500 block">{title}</span>
	{/if}
	<div class="inline-flex" role="group">
		<slot />
		{#if hasQuery}
			{#if $query.error}
				{$query.error}
			{:else}
				{#each $query as { label, value }}
					<ButtonGroupItem {label} {value} />
				{/each}
			{/if}
		{/if}
	</div>
</div>
