<script context="module">
	export const evidenceInclude = true;
	// TODO: How to reflect 2 options with different values but the same label?
	const DISPLAYED_OPTIONS = 5;
</script>

<script>
	import { dropdownOptionStore } from './dropdownOptionStore.js';
	import { onDestroy, setContext } from 'svelte';
	import { DropdownContext } from './constants.js';
	import DropdownOption from './helpers/DropdownOption.svelte';
	import { page } from '$app/stores';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { duckdbSerialize } from '@evidence-dev/sdk/usql';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { resolveMaybePromise } from '@evidence-dev/sdk/usql';

	import * as Command from '$lib/atoms/shadcn/command';
	import DropdownOptionDisplay from './helpers/DropdownOptionDisplay.svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CaretSort } from '@steeze-ui/radix-icons';
	import { Button } from '$lib/atoms/shadcn/button';
	import * as Popover from '$lib/atoms/shadcn/popover';
	import Separator from '$lib/atoms/shadcn/separator/separator.svelte';
	import Badge from '$lib/atoms/shadcn/badge/badge.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import VirtualList from './Virtual.svelte';
	import Info from '../../../unsorted/ui/Info.svelte';
	import { browserDebounce } from '@evidence-dev/sdk/utils';
	import InlineError from '../InlineError.svelte';
	import { toBoolean } from '$lib/utils.js';
	const inputs = getInputContext();
	import checkRequiredProps from '../checkRequiredProps.js';

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

	$: multiple = toBoolean(multiple);

	/**
	 * When true, dropdown will not be shown during print
	 * @type {boolean}
	 */
	export let hideDuringPrint = true;
	$: hideDuringPrint = toBoolean(hideDuringPrint);

	export let disableSelectAll = false;

	$: disableSelectAll = toBoolean(disableSelectAll);

	/**
	 * @type {string | string[]}
	 */
	export let defaultValue = [];
	export let noDefault = false;

	$: noDefault = toBoolean(noDefault);

	/**
	 * When true, all values will be selected by default
	 * @type {boolean}
	 */
	export let selectAllByDefault = false;

	$: selectAllByDefault = toBoolean(selectAllByDefault);

	/**
	 * @type {string | undefined}
	 */
	export let description = undefined;

	// Input Query Props
	export let value = 'value',
		/** @type {string | import("@evidence-dev/sdk/usql").QueryValue }*/
		data,
		label = value,
		order = undefined,
		where = undefined;

	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`Dropdown-${name}`,
		$page?.data?.data[`Dropdown-${name}_data`]
	);
	$: update({ value, data, label, order, where });

	let hasQuery = Boolean(data);

	$: if (query) query.fetch();
	$: ({ hasQuery, query } = $results);

	// Extract initial state
	const initial =
		name in $inputs && 'rawValues' in $inputs[name] && Array.isArray($inputs[name].rawValues)
			? $inputs[name].rawValues
			: [];

	const state = dropdownOptionStore({
		multiselect: multiple,
		defaultValues: Array.isArray(defaultValue) ? defaultValue : [defaultValue],
		initialOptions: initial,
		noDefault,
		selectAllByDefault: toBoolean(selectAllByDefault)
	});
	const {
		addOptions,
		removeOptions,
		options,
		selectedOptions,
		selectAll,
		deselectAll,
		toggleSelected,
		pauseSorting,
		resumeSorting,
		forceSort,
		destroy: destroyStore
	} = state;

	onDestroy(destroyStore);

	const updateInputStore = (newValue) => {
		if (JSON.stringify(newValue) !== JSON.stringify($inputs[name])) {
			$inputs[name] = newValue;
		}
	};

	let opts = [];

	let hasHadSelection = $selectedOptions.length > 0;
	onDestroy(
		selectedOptions.subscribe(($selectedOptions) => {
			hasHadSelection ||= $selectedOptions.length > 0;

			if ($selectedOptions && hasHadSelection) {
				const values = $selectedOptions;
				if (multiple) {
					updateInputStore({
						label: values.map((x) => x.label).join(', '),
						value: values.length
							? `(${values.map((x) => duckdbSerialize(x.value))})`
							: `(select null where 0)`,
						rawValues: values
					});
				} else {
					if (!values.length) {
						updateInputStore({ label: '', value: null, rawValues: [] });
					} else if (values.length) {
						updateInputStore({
							label: values[0].label,
							value: duckdbSerialize(values[0].value, { serializeStrings: false }),
							rawValues: values
						});
					}
				}
			}
		})
	);

	setContext(DropdownContext, {
		registerOption: (targetOption) => {
			addOptions(targetOption);

			return () => {
				removeOptions(targetOption);
			};
		}
	});

	function getIdx(queryOpt) {
		if ('similarity' in queryOpt) return queryOpt.similarity * -1;
		return queryOpt.ordinal ?? 0;
	}
	let open;
	let search = '';

	let searchIdx = 0;
	let finalQuery;

	const updateQuery = browserDebounce(() => {
		searchIdx++;
		if (search && hasQuery) {
			const targetIdx = searchIdx;
			const searchQuery = query.search(search, 'label');
			if (searchQuery.hash !== finalQuery?.hash) {
				resolveMaybePromise(() => {
					if (targetIdx === searchIdx) {
						finalQuery = searchQuery;
						forceSort();
					}
				}, searchQuery.fetch());
				// await tick();
			}
		} else {
			finalQuery = query ?? data;
		}
	}, 100);
	$: search, data, query, updateQuery();

	$: open ? pauseSorting() : resumeSorting();

	$: if ($finalQuery?.dataLoaded) opts = $finalQuery;

	let errors = [];

	if (!value) {
		if (data) {
			errors.push('Missing required prop: "value".');
		} else if (!$$slots.default) {
			errors.push('Dropdown requires either "value" and "data" props or <DropdownOption />.');
		}
	}

	if (data) {
		if (typeof data !== 'object') {
			if (typeof data === 'string') {
				errors.push(
					`'${data}' is not a recognized query result. Data should be provided in the format: data = {'${data.replace('data.', '')}'}`
				);
			} else {
				errors.push(
					`'${data}' is not a recognized query result. Data should be an object. e.g data = {QueryName}`
				);
			}
		}
	}

	try {
		checkRequiredProps({ name });
	} catch (err) {
		errors.push(err.message);
	}
	// temp fix for multiple queryErrors be thrown
	let hasQueryError = false;
	$: if ($query?.error && hasQuery && !hasQueryError) {
		errors = [...errors, $query.error];
		hasQueryError = true;
	}
</script>

<slot />

{#each opts as option (`${option.label?.toString()} ${option.value?.toString()}`)}
	<DropdownOption
		value={option[value] ?? option.value}
		valueLabel={option[label] ?? option.label}
		idx={getIdx(option)}
		__auto
	/>
{/each}

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 ml-0 mr-2 inline-block">
		{#if errors.length > 0}
			<InlineError inputType="Dropdown" error={errors} height="32" width="140" />
			<!-- {:else if hasQuery && $query.error}
			<span
				class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-negative py-[1px] bg-negative/10 rounded-sm"
			>
				<span class="inline font-sans font-medium text-xs text-negative">error</span>
				<span
					class="hidden font-sans group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-base-200 border border-base-300 leading-relaxed min-w-[150px] w-max max-w-[400px] rounded-md"
				>
					{$query.error}
				</span>
			</span> -->
		{:else}
			<Popover.Root bind:open>
				<Popover.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="outline"
						role="combobox"
						size="sm"
						class="min-w-5 h-8 border border-base-300"
						aria-label={title ?? formatTitle(name)}
					>
						{#if title && !multiple}
							{title}
							{#if description}
								<Info {description} className="pl-1" />
							{/if}
							{#if $selectedOptions.length > 0}
								<Separator orientation="vertical" class="mx-2 h-4" />
								{$selectedOptions[0].label}
							{/if}
						{:else if $selectedOptions.length > 0 && !multiple}
							{$selectedOptions[0].label}
						{:else}
							{title ?? formatTitle(name)}
							{#if description}
								<Info {description} className="pl-1" />
							{/if}
						{/if}
						<Icon src={CaretSort} class="ml-2 h-4 w-4" />
						{#if $selectedOptions.length > 0 && multiple}
							<Separator orientation="vertical" class="mx-2 h-4" />
							<Badge variant="default" class="rounded-xs px-1 font-normal sm:hidden">
								{$selectedOptions.length}
							</Badge>
							<div class="hidden space-x-1 sm:flex">
								{#if $selectedOptions.length > 3}
									<Badge variant="default" class="rounded-xs px-1 font-normal">
										{$selectedOptions.length} Selected
									</Badge>
								{:else}
									{#each $selectedOptions as option}
										<Badge variant="default" class="rounded-xs px-1 font-normal">
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
								{#if $options.length <= DISPLAYED_OPTIONS}
									{#each $options as option, i}
										<DropdownOptionDisplay
											id={i}
											value={option.value}
											valueLabel={option.label}
											handleSelect={({ value, label }) => {
												toggleSelected({ value, label });
												if (!multiple) open = false;
											}}
											{multiple}
											active={$selectedOptions.some(
												(x) => x.value === option.value && x.label === option.label
											)}
										/>
									{/each}
								{:else}
									<VirtualList
										height={`${DISPLAYED_OPTIONS * 32}px`}
										items={$options}
										let:item={option}
									>
										<DropdownOptionDisplay
											value={option?.value}
											valueLabel={option?.label}
											handleSelect={({ value, label }) => {
												toggleSelected({ value, label });
												if (!multiple) open = false;
											}}
											{multiple}
											active={$selectedOptions.some(
												(x) => x.value === option.value && x.label === option.label
											)}
										/>
									</VirtualList>
								{/if}
							</Command.Group>
							{#if multiple}
								{#if !disableSelectAll}
									<div class="-mx-1 h-px bg-base-300" />
									<Command.Item class="justify-center text-center" onSelect={selectAll}>
										Select all
									</Command.Item>
								{/if}
								<div class="-mx-1 h-px bg-base-300" />
								<Command.Item
									disabled={$selectedOptions.length === 0}
									class="justify-center text-center"
									onSelect={deselectAll}
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
