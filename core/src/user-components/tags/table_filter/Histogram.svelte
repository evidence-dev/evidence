<script lang="ts">
	// This component displays a histogram visualization with min/max labels
	import { Query } from '../../../Query.svelte';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { fly } from 'svelte/transition';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { logger } from '../../../shims/logger';

	let {
		min = 0,
		max = 0,
		data = '',
		column = ''
	}: {
		min?: number;
		max?: number;
		data?: string;
		column?: string;
	} = $props();

	// Format number for display based on magnitude (K for thousands, M for millions)
	function formatNumber(num: number): string {
		if (Math.abs(num) >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (Math.abs(num) >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		} else if (Number.isInteger(num)) {
			return num.toString();
		} else {
			return num.toFixed(1);
		}
	}

	// SQL query string - Use a flattened output format
	const sqlQuery = $derived(`
-- make the display height at least 1 for anything that has a height >0
WITH max_data AS (
    SELECT max(${column}) AS max_val
    FROM ${data}
),

buckets AS (
    SELECT 
        floor(${column} / (max_val / 21)) - 1 AS bucket,
        floor(${column} / (max_val / 21)) * (max_val / 21) AS range_min,
		(floor(${column} / (max_val / 21)) + 1) * (max_val / 21) AS range_max,
        count(*) AS height
    FROM 
        ${data},
        max_data
    GROUP BY 
        bucket, range_min, range_max
),

max_height AS (
    SELECT max(height) AS max_height
    FROM buckets
)

SELECT 
    bucket,
    range_min AS lower_bound,
    range_max AS upper_bound,
    height,
    CASE 
        WHEN height = 0 THEN 0
        ELSE GREATEST(10, ROUND((height / max_height) * 100)) 
    END AS display_height
FROM 
    buckets,
    max_height
ORDER BY 
    bucket WITH FILL
	`);

	// Create a query instance
	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const query = new Query(() => sqlQuery, {
		connection,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	});

	const isLoading = $derived(query.loading);

	// Process histogram bars from the query result
	const histogramBars = $derived.by(() => {
		if (!query.result?.rows?.length) {
			return null;
		}

		try {
			// Results should be in the format [{lower_bound: x, upper_bound: y, height: z, display_height: w}, ...]
			const bars = query.result.rows.map((row) => ({
				lowerBound:
					typeof row.lower_bound === 'string'
						? parseFloat(row.lower_bound)
						: Number(row.lower_bound),
				upperBound:
					typeof row.upper_bound === 'string'
						? parseFloat(row.upper_bound)
						: Number(row.upper_bound),
				height: typeof row.height === 'string' ? parseFloat(row.height) : Number(row.height),
				displayHeight:
					typeof row.display_height === 'string'
						? parseFloat(row.display_height)
						: Number(row.display_height)
			}));

			return bars;
		} catch (e) {
			logger.error(e, 'Error processing histogram data');
			return null;
		}
	});

	// Calculate min and max values from the actual data
	const dataMin = $derived.by(() => {
		if (!histogramBars || histogramBars.length === 0) return min;
		return histogramBars[0]?.lowerBound;
	});

	const dataMax = $derived.by(() => {
		if (!histogramBars || histogramBars.length === 0) return max;
		return histogramBars[histogramBars.length - 1]?.upperBound;
	});
</script>

<!-- Query results display -->
{#if column}
	<div class="bg-background mb-2 rounded p-1">
		<div class="relative h-12 w-full">
			<!-- Histogram bars -->
			<div class="absolute bottom-2 flex h-8 w-full items-end">
				{#each Array(20) as _, i}
					<div
						class="bg-accent flex-1 transition-[height]"
						style="height: {isLoading ? '31' : histogramBars?.[i]?.displayHeight}%; margin: 0 1px;"
					>
						<span class="sr-only">
							{isLoading ? 'Loading...' : histogramBars?.[i]?.height || 0} items
						</span>
					</div>
				{/each}
			</div>

			<!-- X axis line -->
			<!-- <div class="absolute bottom-2 h-px w-full bg-accent"></div> -->

			<!-- Min/Max labels -->
			{#if !isLoading && histogramBars && histogramBars.length > 0}
				<div
					class="text-muted-foreground absolute -bottom-3 left-0 w-full text-[10px]"
					in:fly={{ x: 20 }}
				>
					<div class="flex justify-between">
						<span>{formatNumber(dataMin)}</span>
						<span>{formatNumber(dataMax)}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else if query.error}
	<div class="bg-background mb-2 rounded p-2">
		<div class="text-destructive text-xs">
			Error: {query.error}
		</div>
	</div>
{:else}
	<div class="bg-background mb-2 rounded p-2">
		<div class="text-muted-foreground text-xs">
			No histogram data available

			<!-- Debug information -->
			<details class="border-muted mt-1 border-t pt-1 text-[10px]">
				<summary>Debug Info</summary>
				<div class="mt-1">
					<strong>Query:</strong>
					{sqlQuery}
				</div>
				{#if query.result}
					<div class="mt-1">
						<strong>Query Result:</strong>
						<pre class="mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(
								query.result,
								null,
								2
							)}</pre>
					</div>
				{/if}
			</details>
		</div>
	</div>
{/if}
