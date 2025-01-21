<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import DateInput from '../date-input/_DateInput.svelte';
	import { hydrateFromUrlParam, updateUrlParam } from '@evidence-dev/sdk/utils/svelte';
	import { getLocalTimeZone } from '@internationalized/date';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import { page } from '$app/stores';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
	import Info from '../../../unsorted/ui/Info.svelte';

	import { Skeleton } from '$lib/atoms/skeletons/index.js';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { dateToYYYYMMDD, formatDateString } from '../date-input/helpers.js';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';

	const inputs = getInputContext();
	/** @type {string} */
	export let name;
	/** @type {string | undefined} */
	export let title;
	/** @type {string | undefined} */
	export let description;
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

	$: hydrateFromUrlParam(name, (v) => {
			if (v) {
				if (v.includes('_to_')) {
					// Handle date range
					const [start, end] = v.split('_to_');
					startString = `${start}`;
					endString = `${end}`;
				} else {
					// Handle single date
					startString = v;
				}
			}
		}
	);

	function onSelectedDateInputChange(selectedDateInput) {
		if (selectedDateInput && (selectedDateInput.start || selectedDateInput.end)) {
			const start = dateToYYYYMMDD(selectedDateInput.start?.toDate(getLocalTimeZone()) ?? new Date(0));
			const end =  dateToYYYYMMDD(selectedDateInput.end?.toDate(getLocalTimeZone()) ?? new Date());
			$inputs[name] = { start, end };

			// Serialize range for URL (e.g., "2024-01-01_to_2024-01-31")
			const serializedRange = `${start}_to_${end}`;
			updateUrlParam(name, serializedRange);
		}
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	<div class={`${title ? '-mt-0.5' : 'mt-2'} mb-4 ml-0 mr-2 inline-block`}>
		{#if title}
			<span class="text-xs font-medium text-base-content block mb-0.5"
				>{title}
				{#if description}
					<Info {description} />
				{/if}
			</span>
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

				<DateInput
					{onSelectedDateInputChange}
					start={startString}
					end={endString}
					loaded={loaded?.ready ?? true}
					{presetRanges}
					{defaultValue}
					range
				/>
			</QueryLoad>
		{/if}
	</div>
</HiddenInPrint>
