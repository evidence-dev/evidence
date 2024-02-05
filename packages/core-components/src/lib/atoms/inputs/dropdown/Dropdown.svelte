<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import VirtualList from './Virtual.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildInputQuery, buildQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import DropdownOption from './DropdownOption.svelte';
	import * as Command from '$lib/atoms/shadcn/command';
	import { CaretSort } from 'radix-icons-svelte';
	import * as Popover from '$lib/atoms/shadcn/popover';
	import { Button } from '$lib/atoms/shadcn/button';
	import Separator from '$lib/atoms/shadcn/separator/separator.svelte';
	import Badge from '$lib/atoms/shadcn/badge/badge.svelte';
	import Invisible from './Invisible.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/** @typedef {Object} Option
	 * @property {string} label
	 * @property {string} value
	 */

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	export let multiple = false;

	export let hideDuringPrint = true;

	/** @type {string} */
	export let defaultValue = undefined;

	setContext('dropdown_context', {
		defaultValue,
		hasBeenSet: false,
		handleSelect,
		multiple
	});

	const selectedValues = writable([]);
	setContext('dropdown_selected_values', selectedValues);

	function jsToDuckDB(value) {
		if (value == null) return 'null';
		if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`;
		if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean')
			return String(value);
		if (value instanceof Date) return `'${value.toISOString()}'::TIMESTAMP_MS`;
		if (Array.isArray(value)) return `[${value.map((x) => jsToDuckDB(x)).join(',')}]`;
		return JSON.stringify(value);
	}

	function selectedValuesToInput() {
		let values;
		if (multiple) {
			values = $selectedValues.map((x) => x.value);
			values.toString = () => jsToDuckDB(values);
		} else {
			values = $selectedValues[0]?.value ?? null;
			// the default `toString` method for Dates aren't good for duckdb
			if (values instanceof Date) values.toString = () => jsToDuckDB(values);
		}

		$inputs[name] = {
			label: $selectedValues.map((x) => x.label).join(', '),
			value: values
		};
	}

	let open = false;

	/** @param currentValue {Option} */
	function handleSelect(currentValue) {
		if (!multiple) {
			$selectedValues = [currentValue];
			open = false;
		} else {
			if (
				$selectedValues.find(
					(x) => x.value === currentValue.value && x.label === currentValue.label
				)
			) {
				$selectedValues = $selectedValues.filter(
					(v) => v.value !== currentValue.value || v.label !== currentValue.label
				);
			} else {
				$selectedValues.push(currentValue);
			}
			$selectedValues = $selectedValues;
		}
		selectedValuesToInput();
	}

	let search = '';

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

	$: items = search
		? buildQuery(
				`SELECT
			    	*,
			    	jaro_winkler_similarity(lower('${search.replaceAll("'", "''")}'), lower(label)) as similarity
				FROM (${query.text}) WHERE similarity > 0.5 ORDER BY similarity DESC`,
				`Dropdown-${name}-searched-${search}`,
				$page.data.data[`Dropdown-${name}-searched-${search}`]
		  )
		: $query;
</script>

<!-- execute the otherwise lazily rendered elements for SSR -->
<Invisible>
	<slot />

	{#if hasQuery}
		{#each $items as item}
			<DropdownOption value={item.value} valueLabel={item.label} />
		{/each}
	{/if}
</Invisible>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 mx-1 inline-block">
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
			<Popover.Root bind:open>
				<Popover.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="outline"
						role="combo-box"
						size="sm"
						class="min-w-5 h-8 border"
					>
						{$selectedValues.length > 0 && !multiple ? $selectedValues[0].label : title}
						<CaretSort class="ml-2 h-4 w-4" />
						{#if $selectedValues.length > 0}
							{#if multiple}
								<Separator orientation="vertical" class="mx-2 h-4" />
								<Badge variant="secondary" class="rounded-sm px-1 font-normal sm:hidden">
									{$selectedValues.length}
								</Badge>
								<div class="hidden space-x-1 sm:flex">
									{#if $selectedValues.length > 3}
										<Badge variant="secondary" class="rounded-sm px-1 font-normal">
											{$selectedValues.length} Selected
										</Badge>
									{:else}
										{#each $selectedValues as option}
											<Badge variant="secondary" class="rounded-sm px-1 font-normal"
												>{option.label}</Badge
											>
										{/each}
									{/if}
								</div>
							{/if}
						{/if}
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-[200px] p-0" align="start" side="bottom">
					<Command.Root shouldFilter={false}>
						<Command.Input placeholder={title} bind:value={search} />
						<Command.List>
							<Command.Empty>No results found.</Command.Empty>
							<Command.Group>
								<slot />

								{#if hasQuery}
									{#await $items.fetch() then _}
										<VirtualList height="160px" items={$items} let:item>
											<DropdownOption value={item.value} valueLabel={item.label} />
										</VirtualList>
									{/await}
								{/if}
							</Command.Group>
							{#if $selectedValues.length > 0 && multiple}
								<Command.Separator />
								<Command.Item
									class="justify-center text-center"
									onSelect={() => {
										$selectedValues = [];
										selectedValuesToInput();
									}}
								>
									Clear selection
								</Command.Item>
							{/if}
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		{/if}
	</div>
</HiddenInPrint>
