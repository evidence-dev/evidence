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
	import { useInput } from '@evidence-dev/sdk/utils/svelte';
	import { parseDate } from '@internationalized/date';

	function dateToYYYYMMDD(date) {
		return date.toISOString().split('T')[0];
	}

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

	let selectedDateRange;
	const input = useInput(
		name,
		{
			sqlFragmentFactory: (input) => {
				return `BETWEEEN DATE('${input.get('start')}') AND DATE('${input.get('end')}')`;
			}
		},
		{ value: defaultValue }
	);
	if (input.__input.hasValue) {
		if (input.__input.get('start') && input.__input.get('end'))
			selectedDateRange = {
				start: parseDate(input.__input.get('start')),
				end: parseDate(input.__input.get('end'))
			};
	}

	const exec = getQueryFunction();
	let query;
	$: if (data && dates) {
		const source = typeof data === 'string' ? data : `(${data.text})`;
		query = Query.create(
			`SELECT min(${dates}) as start, max(${dates}) as end FROM ${source}`,
			exec,
			{
				initialData: $page.data.data[`DateRange-${name}`],
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

	$: {
		if ((query && $query.loaded) || !query) {
			input.update(`${startString} - ${endString}`, `${startString} - ${endString}`, {
				start: startString,
				end: endString
			});
		}
	}

	$: if (selectedDateRange && (selectedDateRange.start || selectedDateRange.end)) {
		const formattedStart = dateToYYYYMMDD(
			selectedDateRange.start?.toDate(getLocalTimeZone()) ?? new Date(0)
		);
		const formattedEnd = dateToYYYYMMDD(
			selectedDateRange.end?.toDate(getLocalTimeZone()) ?? new Date()
		);
		input.update(input.SqlFlag, `${formattedStart} - ${formattedEnd}`, {
			start: formattedStart,
			end: formattedEnd
		});
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 ml-0 mr-2 inline-block">
		{#if title}
			<span class="text-sm text-gray-500 block mb-1">{title}</span>
		{/if}

		{#if $query?.error}
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
