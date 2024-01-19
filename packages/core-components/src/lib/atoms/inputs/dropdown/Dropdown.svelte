<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, setContext } from 'svelte';
	import { page } from '$app/stores';
	import DropdownOption from './DropdownOption.svelte';
	import { Select, Content, Group, Trigger, Value } from '$lib/atoms/shadcn/select/index.js';
	import Invisible from './Invisible.svelte';
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
	export let defaultValue = undefined;

	setContext('dropdown_context', {
		defaultValue,
		hasBeenSet: false,
		setSelectedValue: (selected) => (($inputs[name] = selected), console.log({ selected }))
	});

	/////
	// Query-Related Things
	/////

	export let value, data, label, order, where;
	/** @type {import("@evidence-dev/component-utilities/buildQuery.js").QueryProps}*/
	$: ({ hasQuery, query } = buildInputQuery(
		{ value, data, label, order, where },
		`Dropdown-${name}`,
		$page.data.data[`Dropdown-${name}`]
	));
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 mx-1 inline-block">
		{#if title}
			<span class="text-sm text-gray-500 block">{title}</span>
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
			<!-- execute the otherwise lazily rendered elements for SSR -->
			<Invisible>
				<slot />

				{#if hasQuery}
					{#each $query as { label, value }}
						<DropdownOption {value} valueLabel={label} />
					{/each}
				{/if}
			</Invisible>

			<Select {defaultValue} bind:selected={$inputs[name]}>
				<Trigger class="w-[180px]">
					<Value />
				</Trigger>
				<Content class="overflow-y-auto max-h-[10rem]">
					<Group>
						<slot />

						{#if hasQuery}
							{#each $query as { label, value }}
								<DropdownOption {value} valueLabel={label} />
							{/each}
						{/if}
					</Group>
				</Content>
			</Select>
		{/if}
	</div>
</HiddenInPrint>
