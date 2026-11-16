<script lang="ts">
	import { getLocaleContext } from '../../../locale/locale.context.svelte';
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		ChevronsLeftIcon,
		ChevronsRightIcon
	} from 'lucide-svelte';
	import TablePaginationButton from './TablePaginationButton.svelte';

	const localeContext = getLocaleContext();
	const { t } = localeContext;
	const formatValue = $derived(localeContext.formatValue);

	type Props = {
		page?: number;
		pageSize?: number;
		totalRows?: number;
		loading?: boolean;
	};

	let { page = $bindable(0), pageSize = 10, totalRows, loading }: Props = $props();

	let clickedName: 'first' | 'previous' | 'next' | 'last' | undefined = $state();
	$effect(() => {
		if (!loading) {
			clickedName = undefined;
		}
	});

	const totalPages = $derived.by(() => {
		if (typeof totalRows === 'undefined') return undefined;
		return Math.ceil(totalRows / pageSize);
	});

	const canGoToFirstPage = $derived(page > 0);
	const canGoToPreviousPage = $derived(page > 0);
	const canGoToNextPage = $derived(!totalPages || page < totalPages - 1);
	const canGoToLastPage = $derived(typeof totalPages !== 'undefined' && page < totalPages - 1);
</script>

<div class="flex items-center justify-between pl-1">
	<div class="text-muted-foreground text-xs">
		{#if totalRows !== 0}
			{@const start = formatValue(page * pageSize + 1, 'num0')}
			{@const end = formatValue(Math.min((page + 1) * pageSize, totalRows ?? Infinity), 'num0')}
			{#if typeof totalRows !== 'undefined'}
				{t('table.rows_range', { start, end, total: formatValue(totalRows, 'num0') })}
			{:else}
				{t('table.rows_range_unbounded', { start, end })}
			{/if}
		{:else}
			{t('table.no_rows')}
		{/if}
	</div>
	<div class="flex items-center">
		<TablePaginationButton
			label={t('table.first_page')}
			Icon={ChevronsLeftIcon}
			loading={clickedName === 'first' && loading}
			disabled={!canGoToFirstPage || loading}
			onclick={() => {
				clickedName = 'first';
				page = 0;
			}}
		/>

		<TablePaginationButton
			label={t('table.previous_page')}
			Icon={ChevronLeftIcon}
			loading={clickedName === 'previous' && loading}
			disabled={!canGoToPreviousPage || loading}
			onclick={() => {
				clickedName = 'previous';
				page--;
			}}
		/>

		<span class="text-muted-foreground px-1 text-xs whitespace-nowrap">
			{#if typeof totalPages !== 'undefined'}
				{t('table.page_of', {
					page: formatValue(page + 1, 'num0'),
					total: formatValue(totalPages, 'num0')
				})}
			{:else}
				{formatValue(page + 1, 'num0')}
			{/if}
		</span>

		<TablePaginationButton
			label={t('table.next_page')}
			Icon={ChevronRightIcon}
			loading={clickedName === 'next' && loading}
			disabled={!canGoToNextPage || loading}
			onclick={() => {
				clickedName = 'next';
				page++;
			}}
		/>

		<TablePaginationButton
			label={t('table.last_page')}
			Icon={ChevronsRightIcon}
			loading={clickedName === 'last' && loading}
			disabled={!canGoToLastPage || loading}
			onclick={() => {
				if (typeof totalPages === 'undefined') return;
				clickedName = 'last';
				page = totalPages - 1;
			}}
		/>
	</div>
</div>
