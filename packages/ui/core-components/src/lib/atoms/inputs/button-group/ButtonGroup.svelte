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
	/** @type {'tabs' | 'buttons'} */
	export let display = 'buttons';

	/** @type {string | undefined} */
	export let defaultValue = undefined;

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

	/** @type {string} */
	let error = '';

	function validateConfiguration(preset, display) {
		error = '';
		if (preset) {
			if (typeof preset !== 'string') {
				error += `<p>Invalid type: preset must be a string. preset is type ${typeof preset}</p>`;
			}
			if (preset && !Object.keys(presets).includes(preset)) {
				error += `<p>Invalid preset: ${preset}. Expected one of the following presets: ${Object.keys(presets).join(', ')}</p>`;
			}
		}
		if (display) {
			if (typeof display !== 'string') {
				error += `<p>Invalid type: display must be a string. display is type ${typeof display}</p>`;
			}
			if (!['tabs', 'buttons'].includes(display)) {
				error += `<p>Invalid display: ${display}. Expected 'tabs' or 'buttons'</p>`;
			}
		}
	}

	validateConfiguration(preset, display);
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
				{#if error === ''}
					{#each presets[preset] as { value, valueLabel }}
						<ButtonGroupItem {value} {valueLabel} {color} {display} {defaultValue} />
					{/each}
				{:else}
					<span class="text-red-500 font-bold text-sm">{@html error}</span>
				{/if}
			{:else}
				<slot {display} />
				{#if hasQuery && error === ''}
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
				{:else}
					<span class="text-red-500 font-bold text-sm">{@html error}</span>
				{/if}
			{/if}
		</div>
	</div>
</HiddenInPrint>
