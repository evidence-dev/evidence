<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import DateInput from './_DateInput.svelte';
	// import { Query } from '@evidence-dev/sdk/usql';
	import { getLocalTimeZone } from '@internationalized/date';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { page } from '$app/stores';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
	import { Skeleton } from '$lib/atoms/skeletons/index.js';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { toBoolean } from '../../../utils.js';
	import { dateToYYYYMMDD, formatDateString } from './helpers.js';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';

	const inputs = getInputContext();

	/** @type {string | undefined} */
	export let name = undefined;
	/** @type {string | undefined} */
	export let title = undefined;
	/** @type {boolean} */
	export let hideDuringPrint = true;

	/** @type {string | Date | undefined} */
	export let start;
	/** @type {string | Date | undefined} */
	export let end;

	/** @type {Query | string | undefined} */
	export let data;
	/** @type {string | undefined} */
	export let dates;
	/** @type {string[] | undefined} */
	export let presetRanges;
	/** @type {string | undefined} */
	export let defaultValue;
	/** @type {boolean| string} */
	export let range = false;

	$: range = toBoolean(range);

	let query;
	$: if (data && dates) {
		const queryString = `SELECT min(${dates}) as start, max(${dates}) as end FROM ${typeof data === 'string' ? data : `(${data.text})`}`;
		const id = `DateRange-${name}`;
		const opts = {
			initialData: $page?.data?.data[`DateRange-${name}_data`],
			knownColumns: $page?.data?.data[`DateRange-${name}_columns`],
			disableCache: true,
			noResolve: false
		};
		query = buildQuery(queryString, id, opts.initialData, opts);
		query.fetch();
	}

	$: startString = formatDateString(start || $query?.[0].start || new Date(0));
	$: endString = formatDateString(end || $query?.[0].end || new Date());

	let currentDate = dateToYYYYMMDD(new Date());

	let extraDayEndString;

	$: if (endString && range) {
		extraDayEndString = new Date(endString);
		extraDayEndString.setDate(extraDayEndString.getDate() + 1);
		extraDayEndString = formatDateString(extraDayEndString);
	}

	function onSelectedDateInputChange(selectedDateInput) {
		if (selectedDateInput && (selectedDateInput.start || selectedDateInput.end) && range) {
			$inputs[name] = {
				start: dateToYYYYMMDD(selectedDateInput.start?.toDate(getLocalTimeZone()) ?? new Date(0)),
				end: dateToYYYYMMDD(selectedDateInput.end?.toDate(getLocalTimeZone()) ?? new Date())
			};
		} else if (selectedDateInput && selectedDateInput && !range) {
			$inputs[name] = {
				value: dateToYYYYMMDD(selectedDateInput.toDate(getLocalTimeZone()) ?? new Date(0))
			};
		}
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class={`${title ? '-mt-0.5' : 'mt-2'} mb-4 ml-0 mr-2 inline-block`}>
		{#if title && range}
			<span class="text-sm text-gray-500 block mb-1">{title}</span>
		{/if}

		{#if $query?.error}
			<span
				class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-negative py-[1px] bg-negative/10 rounded"
			>
				<span class="inline font-sans font-medium text-xs text-red-600">error</span>
				<span
					class="hidden font-sans group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-base-200 border border-base-300 leading-relaxed min-w-[150px] w-max max-w-[400px] rounded-md"
				>
					{$query.error}
				</span>
			</span>
		{:else}
			<QueryLoad data={query} let:loaded>
				<svelte:fragment slot="skeleton">
					<Skeleton class="h-8 w-72" />
				</svelte:fragment>
				<DateInput
					{onSelectedDateInputChange}
					start={startString}
					end={endString}
					{extraDayEndString}
					loaded={loaded?.ready ?? true}
					{presetRanges}
					{defaultValue}
					{range}
					{currentDate}
					{title}
				/>
			</QueryLoad>
		{/if}
	</div>
</HiddenInPrint>
