<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import VirtualList from './Virtual.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getContext, onMount, setContext, tick } from 'svelte';
	import { page } from '$app/stores';
	import DropdownOption from './helpers/DropdownOption.svelte';
	import DropdownOptionDisplay from './helpers/DropdownOptionDisplay.svelte';
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
	import { DropdownValueFlag, dropdownOptionStore } from './dropdownOptionStore.js';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

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

	const state = dropdownOptionStore(multiple);
	const { selectedOptions, options, addOption, removeOption, flagOption, select, deselectAll } =
		state;

	setContext(DropdownContext, {
		registerOption: (targetOption) => {
			addOption(targetOption);
			return () => {
				removeOption(targetOption);
			};
		}
	});

	let hasHadSelection = false;
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
				if (values.length) hasHadSelection = true;
				if (!hasHadSelection) return;

				if (!multiple) {
					if (!values.length) {
						$inputs[name] = { label: '', value: null, rawValues: [] };
					} else if (values.length) {
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
				providedValues.length !== knownValues.length &&
				JSON.stringify(providedValues) !== JSON.stringify(knownValues)
			) {
				// External change, we need to react to this
				// Be VERY careful with this; it can lead to an infinite loop
				providedValues.forEach(select);
			}
		})
	);

	let open = false;
	let search = '';

	/////
	// Query-Related Things
	/////

	export let value,
		/** @type {string | import("@evidence-dev/sdk/usql").QueryValue }*/
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
	// Keep input query up to date
	$: update({ value, data, label, order, where });

	// "hash" might just be the string literal if we are operating on a table directly
	$: currentInputHash = typeof data === 'string' ? data : data?.hash;
	let trackedInputHash;
	$: {
		data;
		// If data input changes; then we want to discard any selections that may have been made
		// This happens elsewhere, but if there are items that have the IGNORE_SELECTED flag, we want to make sure they are not
		// kept around
		if (currentInputHash !== trackedInputHash) {
			$options.forEach(($option) => {
				if (!$option.__auto) return; // we don't care
				if (!$option.ignoreSelected) flagOption([$option, DropdownValueFlag.IGNORE_SELECTED]);
			});
			trackedInputHash = currentInputHash;
		}
		// We can remove the flags here once we are done
		// The 150 timeout here is fairly arbitrary, it just needs to be more than the debounce value of the dropdownOptionStore
		setTimeout(() => {
			$options.forEach(($option) => {
				if (!$option.__auto) return; // we don't care
				if ($option.ignoreSelected) flagOption([$option, DropdownValueFlag.IGNORE_SELECTED]);
			});
		}, 150);
	}

	/** @type {{ hasQuery: boolean, query: import("@evidence-dev/sdk/usql").QueryValue }}*/
	$: ({ hasQuery, query } = $results);

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	let queryOptions;

	const updateQueryOptions = debounce(async () => {
		if (search && hasQuery) {
			// When search changes, we want to update the query

			// TODO: This may fall victim to the race condition
			// We need a canonical way / function that handles query replacement like this (e.g. updating buildReactiveInputQuery)
			const searchQ = query.search(search, 'label');

			await searchQ.fetch();

			queryOptions = searchQ;

			if ($selectedOptions.length) {
				// We don't want to get rid of selections that already exist when searching
				$selectedOptions.forEach(($selectedOption) => {
					if (!$selectedOption.removeOnDeselect)
						flagOption([$selectedOption, DropdownValueFlag.REMOVE_ON_DESELECT]);
				});
			}
		} else {
			// Search is gone, remove search holdovers
			$options.forEach(($option) => {
				if ($option.removeOnDeselect) flagOption([$option, DropdownValueFlag.REMOVE_ON_DESELECT]);
			});
			queryOptions = query;
		}
	}, 250);

	// Update the items when the query changes
	$: query, search, updateQueryOptions();

	let optionUpdates;
	$: if (!optionUpdates && ((hasQuery && $query) || !hasQuery)) {
		let firstRun = true;
		optionUpdates = options.subscribe(() => {
			// The store is going to initially publish the _current_ value, which isn't what we want
			// So we can ignore the first update
			if (firstRun) {
				firstRun = false;
				return;
			}
			console.log("Eat my shorts")
			// This is the run which actually has what we want
			setTimeout(evalDefaults, 0);
			optionUpdates();
			optionUpdates = undefined;
		});
	}

	/**
	 * Resets the defaults whenever parameters change
	 */
	function evalDefaults() {
		resolveMaybePromise(
			() => {
				console.log(
					name,
					{ $selectedOptions, $options, defaultValue }
				)
				if ($selectedOptions.length) {
					const presentValues = $selectedOptions.filter((x) =>
						$options.some((o) => o.value === x.value && o.label === x.label)
					);
					if (
						presentValues.length !== $selectedOptions.length &&
						JSON.stringify(presentValues) !== JSON.stringify($selectedOptions)
					) {
						// Clear the selection and reselect the needed values
						// We don't need to do diffs, this rolls up into 1 store action
						deselectAll();
						presentValues.forEach((v) => select(v));
						return; // Action was taken
					}
					if (presentValues.length) return; // no need to take action
				}

				if (noDefault) {
					deselectAll();
					return;
				} else if (
					typeof defaultValue !== 'undefined' &&
					defaultValue !== null &&
					defaultValue.length
				) {
					// hard-coded default
					const _def = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
					if (_def.length) {
						$options.filter((x) => _def.some((d) => x.value === d)).forEach((x) => select(x));
						return;
					}
				} else if (!multiple && $options.length) {
					// Default Behavior: set to the first value
					select($options[0]);
				}

				return;
			},
			// Fetch the query, then wait for DOM updates to flush (this ensures that the options store is up to date)
			() => (query ? query.fetch().then(() => tick()) : tick()),
			(err) => {
				console.error(`Error while updating Dropdown Query: ${err.message}`);
			}
		);
	}
</script>

<slot />
<QueryLoad data={$queryOptions} let:loaded>
	<div slot="skeleton"></div>
	{#each loaded ?? [] as queryOpt (queryOpt.value?.toString() + queryOpt.label?.toString() + queryOpt.similarity?.toString())}
		<DropdownOption
			value={queryOpt.value}
			valueLabel={queryOpt.label}
			idx={(queryOpt.similarity ?? 0) * -1 ?? -1}
			__auto
		/>
	{/each}
</QueryLoad>

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
											select({ value, label });
											if (!multiple) open = false;
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
									<div class="-mx-1 h-px bg-gray-200" />
									<Command.Item
										class="justify-center text-center"
										onSelect={() => {
											$queryOptions.forEach((opt) => {
												flagOption([opt, DropdownValueFlag.FORCE_SELECT]);
											});
										}}
									>
										Select all
									</Command.Item>
								{/if}
								<div class="-mx-1 h-px bg-gray-200" />
								<Command.Item
									disabled={$selectedOptions.length === 0}
									class="justify-center text-center"
									onSelect={() => {
										deselectAll();
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
