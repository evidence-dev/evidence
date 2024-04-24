<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import VirtualList from './Virtual.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import DropdownOption from './DropdownOption.svelte';
	import * as Command from '$lib/atoms/shadcn/command';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CaretSort } from '@steeze-ui/radix-icons';
	import * as Popover from '$lib/atoms/shadcn/popover';
	import { Button } from '$lib/atoms/shadcn/button';
	import Separator from '$lib/atoms/shadcn/separator/separator.svelte';
	import Badge from '$lib/atoms/shadcn/badge/badge.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { browser } from '$app/environment';
	import debounce from 'lodash.debounce';
	import { duckdbSerialize } from '@evidence-dev/sdk/usql';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import Invisible from './Invisible.svelte';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/**
	 * @typedef {Object} DropdownValue
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

	/**
	 * When true, multiple values can be selected
	 * @type {boolean}
	 */
	export let multiple = false;

	/**
	 * When true, dropdown will not be shown during print
	 * @type {boolean}
	 */
	export let hideDuringPrint = true;

	export let disableSelectAll = false;

	/**
	 * @type {string | string[]}
	 */
	export let defaultValue = [];

	export let noDefault = false;
	const _defaultValue = noDefault
		? []
		: Array.isArray(defaultValue)
			? defaultValue
			: [defaultValue];

	/**
	 * Dropdown will select the first option automatically if no default
	 * is provided.
	 *
	 * This behavior is disabled using the `noDefault` prop
	 */
	const skipAutoDefault = noDefault || _defaultValue.length > 0;

	const ctx = {
		hasBeenSet: skipAutoDefault,
		handleSelect,
		multiple
	};
	setContext('dropdown_context', ctx);

	/**
	 * Contains label + value pairs used in the select
	 * @type {import("svelte/store").Writable<DropdownValue[]}>}
	 */
	const selectedValues = writable([]);
	setContext('dropdown_selected_values', selectedValues);

	/**
	 * Transforms selected label + value pairs into the expected value on the input store
	 *
	 * Serializes data to duckdb compatible strings
	 * Joins labels with ', '
	 * Transforms values into an array if multiple
	 */
	function selectedValuesToInput() {
		let values;
		if (multiple) {
			values = $selectedValues.map((x) => x.value);
			values.toString = () =>
				values.length === 0
					? `(select null where 0)`
					: `(${values.map((x) => duckdbSerialize(x)).join(', ')})`;
		} else {
			values = $selectedValues[0]?.value ?? null;
			// the default `toString` method for Dates aren't good for duckdb
			if (values instanceof Date) values.toString = () => duckdbSerialize(values);
		}

		$inputs[name] = {
			label: $selectedValues.map((x) => x.label).join(', '),
			value: values
		};
	}

	let open = false;

	/** @param currentValue {DropdownValue} */
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
				$selectedValues = [...$selectedValues, currentValue];
			}
		}
		selectedValuesToInput();
	}

	let search = '';

	/////
	// Query-Related Things
	/////

	export let value, data, label, order, where;
	/** @type {import("@evidence-dev/component-utilities/buildQuery.js").QueryProps}*/
	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`Dropdown-${name}`,
		$page?.data?.data[`Dropdown-${name}`]
	);
	$: update({ value, data, label, order, where });
	/** @type {{ hasQuery: boolean, query: import("@evidence-dev/sdk/usql").QueryValue }}*/
	$: ({ hasQuery, query } = $results);

	// Uses context under the hood
	const updateItems = debounce(() => {
		if (search && hasQuery) {
			const searchQ = query.search(search, 'label');
			searchQ.fetch().then((v) => {
				items = v;
			});
		} else {
			items = $query;
		}
	}, 250);

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	let items;
	// Update the items when the query changes
	$: search, updateItems();

	/**
	 * Resets the defaults whenever parameters change
	 * @param {import("@evidence-dev/sdk/usql").QueryValue} query
	 */
	function useNewQuery(query) {
		items = query;

		function setDefaults() {
			$selectedValues = query.filter(
				(x) => typeof _defaultValue.find((d) => x.value === d) !== 'undefined'
			);
			selectedValuesToInput();
		}
		if (hasQuery && skipAutoDefault) {
			ctx.hasBeenSet = true;

			if (browser) {
				(async () => {
					await query.fetch();
					setDefaults();
				})();
			} else {
				setDefaults();
			}
		} else {
			ctx.hasBeenSet = false;
		}
	}

	$: useNewQuery($query);
</script>

<Invisible>
	<slot />

	{#if hasQuery}
		<DropdownOption value={$items[0]?.value} valueLabel={$items[0]?.label} />
	{/if}
</Invisible>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 ml-0 mr-2 inline-block">
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
						{#if title && !multiple}
							{title}
							{#if $selectedValues.length > 0}
								<Separator orientation="vertical" class="mx-2 h-4" />
								{$selectedValues[0].label}
							{/if}
						{:else if $selectedValues.length > 0 && !multiple}
							{$selectedValues[0].label}
						{:else}
							{title ?? formatTitle(name)}
						{/if}
						<Icon src={CaretSort} class="ml-2 h-4 w-4" />
						{#if $selectedValues.length > 0 && multiple}
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
										<Badge variant="secondary" class="rounded-sm px-1 font-normal">
											{option.label}
										</Badge>
									{/each}
								{/if}
							</div>
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
									<VirtualList height="160px" items={$items} let:item>
										<DropdownOption value={item.value} valueLabel={item.label} />
									</VirtualList>
								{/if}
							</Command.Group>
							{#if multiple}
								{#if !disableSelectAll}
									<Command.Separator />
									<Command.Item
										class="justify-center text-center"
										onSelect={() => {
											$selectedValues = $items.map((x) => ({ label: x.label, value: x.value }));
											selectedValuesToInput();
										}}
									>
										Select all
									</Command.Item>
								{/if}
								<Command.Separator />
								<Command.Item
									disabled={$selectedValues.length === 0}
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
