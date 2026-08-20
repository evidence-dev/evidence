<script lang="ts">
	import Info from '../info/Info.svelte';
	import formatTitle from '../../formatTitle';
	import type { HeaderCell, ColumnMetaItem } from '../../common/pivot-utils';

	interface Props {
		headerLevels: HeaderCell[][];
		columnMeta: ColumnMetaItem[];
		columns: string[];
		config: {
			dimensions: string[];
			pivots: string[];
			measures: string[];
			measuresFirst: boolean;
			subtotals: boolean;
		};
		measures_first: boolean;
		wrap_titles: boolean;
		format_titles: boolean;
		link?: string;
		shouldHideLinkColumn: boolean;
		// Sorting props - unified interface
		currentSort: { column: string; direction: 'asc' | 'desc' } | null;
		onHeaderClick: (columnId: string) => void;
		// Frozen columns props
		freeze_columns?: number;
		frozenColumnOffsets?: number[];
	}

	const props: Props = $props();

	// Check if a column is frozen based on its index in the bottom-level header
	function isFrozenColumn(columnIndex: number): boolean {
		return (props.freeze_columns ?? 0) > 0 && columnIndex < (props.freeze_columns ?? 0);
	}

	// Get the left offset for a frozen column
	function getFrozenColumnLeft(columnIndex: number): number {
		return props.frozenColumnOffsets?.[columnIndex] ?? 0;
	}
</script>

<thead>
	{#each props.headerLevels as level, levelIndex}
		{@const isBottomLevel = levelIndex === props.headerLevels.length - 1}
		<tr>
			{#each level as cell, filteredHeaderIndex}
				{@const effectiveAlign = cell.align}
				{@const columnMetaForCell = props.columnMeta.find(
					(meta) => meta.key === props.columns[cell.startIndex]
				)}
				{@const grainForTitle = columnMetaForCell?.comparison?.dateGrain}
				{@const periodCountForTitle = columnMetaForCell?.comparison?.periodCount ?? 1}
				{@const comparisonNameForTitle = columnMetaForCell?.comparison?.name}
				{@const displayTitle =
					cell.title ??
					(props.format_titles &&
					cell.headerType !== 'pivot_value' &&
					cell.headerType !== 'column_group'
						? formatTitle(cell.label, grainForTitle, periodCountForTitle, comparisonNameForTitle)
						: cell.label)}
				{@const _columnKey = props.columns[cell.startIndex]}
				{@const isLinkColumn = props.columns[cell.startIndex] === props.link}
				{@const alignClass =
					effectiveAlign === 'right'
						? 'text-right'
						: effectiveAlign === 'center'
							? 'text-center'
							: 'text-left'}
				{@const bottomBorder = isBottomLevel
					? ' border-b border-foreground/40 dark:border-foreground/40'
					: ''}
				{@const isColumnGroupHeader = cell.headerType === 'column_group'}
				{@const isFrozen = isBottomLevel && isFrozenColumn(filteredHeaderIndex)}
				{@const frozenLeft = isFrozen ? getFrozenColumnLeft(filteredHeaderIndex) : 0}
				{@const frozenZIndex = isFrozen
					? 15 + ((props.freeze_columns ?? 0) - filteredHeaderIndex)
					: 2}
				{@const isLastFrozenColumn =
					isFrozen && filteredHeaderIndex === (props.freeze_columns ?? 0) - 1}
				<th
					class="{props.wrap_titles
						? ''
						: 'whitespace-nowrap'} text-foreground bg-background relative sticky top-0 py-1 font-medium
						{isBottomLevel ? 'cursor-pointer' : ''} 
						{isFrozen ? 'left-0' : ''}
						{levelIndex < props.headerLevels.length - 1
						? 'px-3'
						: filteredHeaderIndex === 0
							? 'pr-3 pl-1'
							: 'pr-3 pl-1.5'}
						{cell.render_type === 'column_total' || cell.render_type === 'column_subtotal'
						? 'bg-(--theme-table-pivot-bg) font-semibold dark:border-t-(--theme-table-row-border) dark:border-r-(--theme-table-row-border)'
						: ''}
						{isColumnGroupHeader && displayTitle
						? 'after:bg-foreground/40 text-center font-semibold after:absolute after:right-[1px] after:bottom-[0px] after:left-1 after:h-px after:content-[""]'
						: levelIndex < props.headerLevels.length - 1 && displayTitle
							? 'after:bg-foreground/40 text-center after:absolute after:right-[1px] after:bottom-[0px] after:left-1 after:h-px after:content-[""]'
							: alignClass + bottomBorder}
						{isLinkColumn && props.shouldHideLinkColumn ? 'hidden' : ''}"
					style="{isFrozen
						? `left: ${frozenLeft}px; z-index: ${frozenZIndex};`
						: 'z-index: 2;'}{isLastFrozenColumn
						? ' box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.15);'
						: ''}"
					onclick={isBottomLevel
						? () => props.onHeaderClick(props.columns[cell.startIndex])
						: undefined}
					colspan={cell.colspan ?? 1}
				>
					<span class="inline-flex items-end gap-1">
						{displayTitle}
						{#if cell.info}
							<Info text={cell.info} link={cell.info_link} link_title={cell.info_link_title} />
						{/if}
					</span>
					{#if isBottomLevel}
						<span
							class="text-muted-foreground absolute right-1 bottom-1 w-2 text-center font-normal"
						>
							{#if props.currentSort && props.currentSort.column === props.columns[cell.startIndex]}
								{props.currentSort.direction === 'asc' ? '↑' : '↓'}
							{/if}
						</span>
					{/if}
				</th>
			{/each}
			<!-- Add header for chevron column when table has row links -->
			{#if props.link}
				{@const chevronBottomBorder = isBottomLevel
					? ' border-b border-foreground/40 dark:border-foreground/40'
					: ''}
				<th
					class="{props.wrap_titles
						? ''
						: 'whitespace-nowrap'} text-foreground bg-background sticky top-0 z-2 w-8 py-1 pr-1.5 pl-2 text-center font-medium{chevronBottomBorder}"
				>
					<!-- Empty header for chevron column -->
				</th>
			{/if}
		</tr>
	{/each}
</thead>
