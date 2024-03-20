<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { presets, setButtonGroupContext } from './lib.js';
	import { derived, writable } from 'svelte/store';
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

	let currentValue = null;
	const valueStore = writable(null);
	$: $valueStore = currentValue;
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

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="inline-flex flex-col mt-2 mb-4 ml-0 mr-2">
		{#if title}
			<span class="text-gray-900 text-sm block mb-1">{title}</span>
		{/if}
		<div class="inline-flex rounded-md shadow-sm" role="group">
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
