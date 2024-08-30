<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { presets, setButtonGroupContext } from './lib.js';
	import { writable, readonly } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext, setContext } from 'svelte';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { page } from '$app/stores';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
	/** @type {string} */
	export let name;
	/** @type {string} */
	export let title;
	/** @type {boolean} */
	export let hideDuringPrint = true;

	/** @type {keyof typeof presets | undefined} */
	export let preset = undefined;

	// for Tabs styling
	export let display;

	export let defaultValue;

	setContext('button-display', display);

	export let color = 'hsla(207, 65%, 39%, 1)';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	const valueStore = writable(null);

	setButtonGroupContext((v) => {
		$valueStore = v;
		// the assignment to $inputs is necessary to trigger the change on SSR
		$inputs[name] = v?.value ?? null;
	}, readonly(valueStore));

	/////
	// Query-Related Things
	/////

	export let value, data, label, order, where;

	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`ButtonGroup-${name}`,
		$page?.data?.data[`ButtonGroup-${name}`]
	);
	$: update({ value, data, label, order, where });

	$: ({ hasQuery, query } = $results);
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div
		class={display === 'tabs' ? '' : 'inline-flex w-fit max-w-full flex-col mt-2 mb-4 ml-0 mr-2'}
	>
		{#if title}
			<span class="text-gray-900 text-sm block mb-1">{title}</span>
		{/if}
		<div
			class={display === 'tabs'
				? 'my-6 flex flex-wrap gap-x-1 gap-y-1'
				: 'inline-flex rounded-md shadow-sm overflow-auto border no-scrollbar'}
			role="group"
		>
			{#if preset}
				{#if presets[preset]}
					{#each presets[preset] as { value, valueLabel }}
						<ButtonGroupItem {value} {valueLabel} {color} {display} {defaultValue} />
					{/each}
				{:else}
					<span class="text-red-500 font-bold text-sm">{preset} is not a valid preset</span>
				{/if}
			{:else}
				<slot {display} />
				{#if hasQuery}
					<QueryLoad data={query} let:loaded>
						<svelte:fragment slot="skeleton">
							<div class="h-8 min-w-24 w-full max-width-24 block animate-pulse bg-gray-200" />
						</svelte:fragment>
						<svelte:fragment>
							{#each loaded as { label, value }}
								<ButtonGroupItem {value} valueLabel={label} {color} {display} {defaultValue} />
							{/each}
						</svelte:fragment>
					</QueryLoad>
				{/if}
			{/if}
		</div>
	</div>
</HiddenInPrint>
