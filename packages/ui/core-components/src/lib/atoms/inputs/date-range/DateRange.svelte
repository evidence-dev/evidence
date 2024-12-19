<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import DateRange from './_DateRange.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { getQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import { getLocalTimeZone } from '@internationalized/date';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { page } from '$app/stores';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
	import { Skeleton } from '$lib/atoms/skeletons/index.js';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';

	function dateToYYYYMMDD(date) {
		return date.toISOString().split('T')[0];
	}

	const inputs = getInputContext();
	/** @type {string} */
	export let name;
	/** @type {string | undefined} */
	export let title;
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
	/** @type {[]string | undefined} */
	export let presetRanges;
	/** @type {string | undefined} */
	export let defaultValue;

	const exec = getQueryFunction();
	let query;
	$: if (data && dates) {
		const source = typeof data === 'string' ? data : `(${data.text})`;
		query = Query.create(
			`SELECT min(${dates}) as start, max(${dates}) as end FROM ${source}`,
			exec,
			{
				initialData: $page?.data?.data[`DateRange-${name}_data`],
				knownColumns: $page?.data?.data[`DateRange-${name}_columns`],
				disableCache: true,
				noResolve: false,
				id: `DateRange-${name}`
			}
		);
		query.fetch();
	}

	const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;
	$: startString =
		typeof start === 'string' && YYYYMMDD.test(start)
			? start
			: start instanceof Date
				? dateToYYYYMMDD(start)
				: $query?.[0].start instanceof Date
					? dateToYYYYMMDD($query?.[0].start)
					: dateToYYYYMMDD(new Date(0));
	$: endString =
		typeof end === 'string' && YYYYMMDD.test(end)
			? end
			: end instanceof Date
				? dateToYYYYMMDD(end)
				: $query?.[0].end instanceof Date
					? dateToYYYYMMDD($query?.[0].end)
					: dateToYYYYMMDD(new Date());

	$: if ((query && $query.dataLoaded) || !query) {
		$inputs[name] = { start: startString, end: endString };
	}

	let selectedDateRange;
	$: if (selectedDateRange && (selectedDateRange.start || selectedDateRange.end)) {
		$inputs[name] = {
			start: dateToYYYYMMDD(selectedDateRange.start?.toDate(getLocalTimeZone()) ?? new Date(0)),
			end: dateToYYYYMMDD(selectedDateRange.end?.toDate(getLocalTimeZone()) ?? new Date())
		};
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mb-4 ml-0 mr-2 inline-block">
		{#if title}
			<span class="text-xs font-medium text-base-content block mb-0.5">{title}</span>
		{/if}

		{#if $query?.error}
			<span
				class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-negative py-[1px] bg-negative/10 rounded"
			>
				<span class="inline font-sans font-medium text-xs text-negative">error</span>
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

				<DateRange
					bind:selectedDateRange
					start={startString}
					end={endString}
					loaded={loaded?.ready ?? true}
					{presetRanges}
					{defaultValue}
				/>
			</QueryLoad>
		{/if}
	</div>
</HiddenInPrint>
