<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { presets, setButtonGroupContext } from './lib.js';
	import { writable, readonly } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
	import { buildInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { page } from '$app/stores';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	/** @type {string} */
	export let name;
	/** @type {string} */
	export let title;
	/** @type {boolean} */
	export let hideDuringPrint = true;

	/** @type {keyof typeof presets | undefined} */
	export let preset = undefined;

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
	/** @type {import("@evidence-dev/component-utilities/buildQuery.js").QueryProps} */
	$: ({ hasQuery, query } = buildInputQuery(
		{ value, data, label, order, where },
		`ButtonGroup-${name}`,
		$page?.data?.data[`ButtonGroup-${name}`]
	));
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="inline-flex  w-fit max-w-full flex-col mt-2 mb-4 ml-0 mr-2">
		{#if title}
			<span class="text-gray-900 text-sm block mb-1">{title}</span>
		{/if}
		<div class="inline-flex rounded-md shadow-sm overflow-auto border no-scrollbar" role="group">
			{#if preset}
				{#if presets[preset]}
					{#each presets[preset] as { value, valueLabel }}
						<ButtonGroupItem {value} {valueLabel} />
					{/each}
				{:else}
					<span class="text-red-500 font-bold text-sm">{preset} is not a valid preset</span>
				{/if}
			{:else}
				<slot />
				{#if hasQuery}
					{#if $query.error}
						{$query.error}
					{:else}
						{#each $query as { label, value }}
							<ButtonGroupItem {value} valueLabel={label} />
						{/each}
					{/if}
				{/if}
			{/if}
		</div>
	</div>
</HiddenInPrint>
