<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import VirtualList from './Virtual.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, onMount, setContext, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import DropdownOption from './DropdownOption.svelte';
	import DropdownOptionDisplay from './DropdownOptionDisplay.svelte';
	import * as Command from '$lib/atoms/shadcn/command';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CaretSort } from '@steeze-ui/radix-icons';
	import * as Popover from '$lib/atoms/shadcn/popover';
	import { Button } from '$lib/atoms/shadcn/button';
	import Separator from '$lib/atoms/shadcn/separator/separator.svelte';
	import Badge from '$lib/atoms/shadcn/badge/badge.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import debounce from 'lodash.debounce';
	import { duckdbSerialize, resolveMaybePromise } from '@evidence-dev/sdk/usql';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import { DropdownContext } from './constants.js';
	import QueryLoad from '../../query-load/QueryLoad.svelte';

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
	export let title = undefined;

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

	const options = writable([]);
	setContext(DropdownContext, {
		registerOption: (targetOption) => {
			options.update((optionValue) => [...optionValue, targetOption]);
			return () => {
				options.update((optionValue) =>
					optionValue.filter(
						(opt) => opt.value !== targetOption.value || opt.label !== targetOption.label
					)
				);
			};
		}
	});

	/** @type {import("svelte/store").Writable<DropdownValue[]>}*/
	const selectedOptions = writable([]);

	onMount(() =>
		selectedOptions.subscribe(
			/**
			 * Transforms selected label + value pairs into the expected value on the input store
			 *
			 * Serializes data to duckdb compatible strings
			 * Joins labels with ', '
			 * Transforms values into an array if multiple
			 */
			(values) => {
				if (!multiple) {
					if (!values.length) {
						$inputs[name] = { label: '', value: null, rawValues: [] };
					} else if (values.length) {
						console.log('%cFIZZ', 'font-size: 36px;', values);
						$inputs[name] = {
							label: values[0].label,
							value: duckdbSerialize(values[0].value, { serializeStrings: false }),
							rawValues: values
						};
					}
				} else {
					// transform
					$inputs[name] = {
						label: values.map((x) => x.label).join(', '),
						value: values.length
							? `(${values.map((x) => duckdbSerialize(x.value))})`
							: `(select null where 0)`,
						rawValues: values
					};
				}
			}
		)
	);
	onMount(() =>
		inputs.subscribe(($i) => {
			const providedValues = Array.isArray($i[name].rawValues)
				? $i[name]?.rawValues
				: [$i[name]?.rawValues];
			const knownValues = $selectedOptions;

			if (
				providedValues.every(Boolean) &&
				JSON.stringify(providedValues) !== JSON.stringify(knownValues)
			) {
				// External change, we need to react to this
				// Be VERY careful with this; it can lead to an infinite loop
				selectedOptions.set(providedValues);
			}
		})
	);

	let open = false;
	let search = '';

	/////
	// Query-Related Things
	/////

	export let value,
		data,
		label,
		order = undefined,
		where = undefined;
	/** @type {import("@evidence-dev/component-utilities/buildQuery.js").QueryProps}*/
	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`Dropdown-${name}`,
		$page?.data?.data[`Dropdown-${name}`]
	);
	$: update({ value, data, label, order, where });
	/** @type {{ hasQuery: boolean, query: import("@evidence-dev/sdk/usql").QueryValue }}*/
	$: ({ hasQuery, query } = $results);

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	let queryOptions;

	// Uses context under the hood
	const updateQueryOptions = debounce(async () => {
		if (search && hasQuery) {
			// TODO: This may fall victim to the race condition
			// We need a canonical way / function that handles query replacement like this (e.g. updating buildReactiveInputQuery)
			const searchQ = query.search(search, 'label');
			await searchQ.fetch();
			queryOptions = searchQ;
		} else {
			queryOptions = query;
		}
	}, 250);

	// Update the items when the query changes
	$: search, query, updateQueryOptions();

	/**
	 * Resets the defaults whenever parameters change
	 */
	function evalDefaults() {
		resolveMaybePromise(
			() => {
				if ($selectedOptions.length) {
					// Try to keep any current selection before falling back to defaults
					// e.g. if the passed-in query has changed, but the user had a previous selection
					const presentValues = $selectedOptions.filter((x) =>
						$options.some((o) => o.value === x.value && o.label === x.label)
					);
					// If the available values have changed (e.g. one is missing in the new query), remove that one and update the selection
					if (presentValues.length !== $selectedOptions.length) $selectedOptions = presentValues;
					// If there is at least one selection remaining, then we don't need to revert to defaults
					if ($selectedOptions.length) return;
				}
				if (noDefault)
					return; // noop
				else if (typeof defaultValue !== 'undefined' && defaultValue !== null) {
					// hard-coded default
					const _def = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
					if (_def.length) {
						const presentDefaults = $options.filter((x) => _def.some((d) => x.value === d));
						// const missingDefaults = _def.filter((d) => !presentDefaults.some((x) => x.value === d));
						if (presentDefaults.length) {
							$selectedOptions = [...presentDefaults];
						}
						return;
					}
				}
				// Default Behavior: set to the first value
				if (!multiple && $selectedOptions.length) $selectedOptions = [$options[0]];
			},
			// Fetch the query, then wait for DOM updates to flush (this ensures that the options store is up to date)
			() => (query ? query.fetch().then(() => tick()) : tick()),
			(err) => {
				console.error(`Error while updating Dropdown Query: ${err.message}`);
			}
		);
	}

	$: $query, $options, evalDefaults();
</script>

<slot />
<!-- 
	Key is needed here to ensure that we re-render the options list 
	If we don't do this, sorting is not properly updated
-->
{#key queryOptions}
	<QueryLoad data={$queryOptions} let:loaded>
		<!-- TODO: Add temporary option that shows loading state -->
		{#each loaded?.sort((a, b) => a.idx - b.idx) ?? [] as queryOpt, i (queryOpt.value)}
			<DropdownOption value={queryOpt.value} valueLabel={queryOpt.label} idx={i} />
		{/each}
	</QueryLoad>
{/key}

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
							{#if $selectedOptions.length > 0}
								<Separator orientation="vertical" class="mx-2 h-4" />
								{$selectedOptions[0].label}
							{/if}
						{:else if $selectedOptions.length > 0 && !multiple}
							{$selectedOptions[0].label}
						{:else}
							{title ?? formatTitle(name)}
						{/if}
						<Icon src={CaretSort} class="ml-2 h-4 w-4" />
						{#if $selectedOptions.length > 0 && multiple}
							<Separator orientation="vertical" class="mx-2 h-4" />
							<Badge variant="secondary" class="rounded-sm px-1 font-normal sm:hidden">
								{$selectedOptions.length}
							</Badge>
							<div class="hidden space-x-1 sm:flex">
								{#if $selectedOptions.length > 3}
									<Badge variant="secondary" class="rounded-sm px-1 font-normal">
										{$selectedOptions.length} Selected
									</Badge>
								{:else}
									{#each $selectedOptions as option}
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
								<VirtualList height="160px" items={$options} let:item={option}>
									<DropdownOptionDisplay
										value={option?.value}
										valueLabel={option?.label}
										handleSelect={({ value, label }) => {
											if (multiple) {
												if ($selectedOptions.find((x) => x.value === value && x.label === label)) {
													$selectedOptions = $selectedOptions.filter(
														(x) => x.value !== value || x.label !== label
													);
												} else {
													$selectedOptions = [...$selectedOptions, { value, label }];
												}
											} else {
												$selectedOptions = [{ value, label }];
												open = false;
											}
										}}
										{multiple}
										active={$selectedOptions.some(
											(x) => x.value === option.value && x.label === option.label
										)}
									/>
								</VirtualList>
							</Command.Group>
							{#if multiple}
								{#if !disableSelectAll}
									<Command.Separator />
									<Command.Item
										class="justify-center text-center"
										onSelect={() => {
											$selectedOptions = $queryOptions.map((x) => ({
												label: x.label,
												value: x.value
											}));
										}}
									>
										Select all
									</Command.Item>
								{/if}
								<Command.Separator />
								<Command.Item
									disabled={$selectedOptions.length === 0}
									class="justify-center text-center"
									onSelect={() => {
										$selectedOptions = [];
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
