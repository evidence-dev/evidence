<script lang="ts">
	import * as Alert from '../../shadcn/components/ui/alert';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
	import { page } from '../../shims/page-state';

	type Props = {
		rowLimitExceeded?: boolean;
		columnLimitExceeded?: boolean;
		estimatedColumns?: number;
		hasPivots?: boolean;
		hasSubtotals?: boolean;
	};

	const {
		rowLimitExceeded,
		columnLimitExceeded,
		estimatedColumns,
		hasPivots,
		hasSubtotals
	}: Props = $props();

	// Only show in edit route, not preview/published
	const isEditRoute = $derived(page.route.id?.includes('/edit'));

	// Row limit warning only matters if user loses pivoting or subtotals.
	// If they have no pivots and subtotals=false, server-side pagination is expected.
	const showRowWarning = $derived(rowLimitExceeded && (hasPivots || hasSubtotals));

	const hasWarnings = $derived((showRowWarning || columnLimitExceeded) && isEditRoute);
</script>

{#if hasWarnings}
	<Alert.Root variant="destructive" class="mb-2 px-3 py-1.5 text-[11px]">
		<TriangleAlert class="h-3 w-3" />
		<Alert.Description class="text-[11px] leading-tight">
			{#if showRowWarning && columnLimitExceeded}
				Table exceeds 100,000 row limit — pivoting and subtotals disabled. Also exceeds the 500
				column limit{estimatedColumns ? ` (${estimatedColumns} columns)` : ''} — pivots converted to
				regular columns. Add filters to reduce the result size.
			{:else if showRowWarning}
				Table exceeds 100,000 row limit — pivoting and subtotals disabled. Add filters or reduce
				dimensions to bring the result under 100,000 rows.
			{:else}
				Exceeds the 500 column limit{estimatedColumns ? ` (${estimatedColumns} columns)` : ''} — pivots
				converted to regular columns. Add filters to reduce the number of unique pivot values.
			{/if}
		</Alert.Description>
	</Alert.Root>
{/if}
