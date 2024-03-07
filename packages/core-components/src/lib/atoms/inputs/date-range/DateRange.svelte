<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import DateRange from './_DateRange.svelte';
	import { getContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { QueryStore } from '@evidence-dev/query-store';
	import { getQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import { getLocalTimeZone } from '@internationalized/date';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { page } from '$app/stores';

	function dateToYYYYMMDD(date) {
		return date.toISOString().split('T')[0];
	}

	const inputs = getContext(INPUTS_CONTEXT_KEY);

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

	/** @type {QueryStore | string | undefined} */
	export let data;
	/** @type {string | undefined} */
	export let dates;

	const exec = getQueryFunction();
	let query;
	$: if (data && dates) {
		const source = typeof data === 'string' ? data : `(${data.text})`;
		query = QueryStore.create(
			`SELECT min(${dates}) as start, max(${dates}) as end FROM ${source}`,
			exec,
			`DateRange-${name}`,
			{
				initialData: $page.data.data[`DateRange-${name}`],
				disableCache: true,
				noResolve: false
			}
		);
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

	$: $inputs[name] = { start: startString, end: endString };

	let selectedDateRange;
	$: if (selectedDateRange && (selectedDateRange.start || selectedDateRange.end)) {
		$inputs[name] = {
			start: dateToYYYYMMDD(selectedDateRange.start?.toDate(getLocalTimeZone()) ?? new Date(0)),
			end: dateToYYYYMMDD(selectedDateRange.end?.toDate(getLocalTimeZone()) ?? new Date())
		};
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class="mt-2 mb-4 mx-1 inline-block">
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
			<DateRange bind:selectedDateRange start={startString} end={endString} />
		{/if}
	</div>
</HiddenInPrint>
