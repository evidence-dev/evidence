<script>
	import SortIcon from '../../ui/SortIcon.svelte';
	import { safeExtractColumn } from './datatable.js';

	export let rowNumbers = undefined;
	export let headerColor = undefined;
	export let headerFontColor = undefined;
	export let orderedColumns = undefined;
	export let columnSummary = undefined;
	export let sortable = undefined;
	export let sortClick = undefined;
	export let formatColumnTitles = undefined;
	export let sortObj = undefined;
	export let wrapTitles = undefined;
	export let compact = undefined;

	/** @type {string | undefined} */
	export let link = undefined;

	let gradientAsc = 'linear-gradient(to top, rgba(229, 231, 235, 1), rgba(229, 231, 235, 0))';
	let gradientDesc = 'linear-gradient(to bottom, rgba(229, 231, 235, 1), rgba(229, 231, 235, 0))';
</script>

<thead>
	{#if orderedColumns.length > 0}
		{@const columnsWithGroupSpan = orderedColumns.map((column, index, array) => {
			// Determine if this column starts a new group or continues an existing one
			let isNewGroup = index === 0 || column.colGroup !== array[index - 1].colGroup;
			let span = 1;
			if (column.colGroup) {
				// Count how many contiguous columns have the same group
				for (let i = index + 1; i < array.length && array[i].colGroup === column.colGroup; i++) {
					span++;
				}
			}
			return { ...column, isNewGroup, span: isNewGroup ? span : 0 }; // Only assign span to the first column in a group
		})}
		{#if columnsWithGroupSpan.length > 0}
			<tr class="border-0" style:background-color={headerColor}>
				{#if rowNumbers}
					<th
						class="index w-[2%] {compact ? 'text-xs py-[1px] px-[4px]' : 'py-[2px]'}"
						style:background-color={headerColor}
					/>
				{/if}
				{#each columnsWithGroupSpan as column}
					{#if column.colGroup && column.isNewGroup}
						<th
							role="columnheader"
							colspan={column.span}
							class="pt-1 align-bottom text-gray-900 {compact ? 'px-[1px]' : 'px-[2px]'}"
						>
							<!-- Group header with dynamic colspan -->
							<div class=" border-b-[1px] border-b-gray-600 whitespace-normal pb-[2px]">
								{column.colGroup}
							</div>
						</th>
					{:else if column.colGroup}
						<!-- Not new group, th covered by previous column span-->
					{:else}
						<!-- Not part of a group - empty header cell -->
						<th></th>
					{/if}
				{/each}
			</tr>
		{/if}
	{/if}

	<tr class="border-b border-gray-600">
		{#if rowNumbers}
			<th
				role="columnheader"
				class="index w-[2%] {compact ? 'text-xs py-[1px] px-[4px]' : 'py-[2px] px-[8px]'}"
				style:background-color={headerColor}
			/>
		{/if}
		{#each orderedColumns as column}
			<th
				role="columnheader"
				class="{safeExtractColumn(column, columnSummary).type} {compact
					? 'text-xs py-[1px] px-[4px]'
					: 'py-[2px] pl-[6px]'}"
				style:text-align={column.align ??
					(['sparkline', 'sparkbar', 'sparkarea', 'bar'].includes(column.contentType)
						? 'center'
						: undefined)}
				style:color={headerFontColor}
				style:background={sortObj.col === column.id
					? sortObj.ascending
						? gradientAsc
						: gradientDesc
					: { headerColor }}
				style:cursor={sortable ? 'pointer' : 'auto'}
				on:click={sortable ? sortClick(column.id) : ''}
				style:vertical-align="bottom"
				style:border-radius={sortObj.col === column.id ? '2px' : ''}
			>
				<div class="flex items-end justify-between">
					<span class={wrapTitles || column.wrapTitle ? 'whitespace-normal' : ''}>
						{column.title
							? column.title
							: formatColumnTitles
								? safeExtractColumn(column, columnSummary).title
								: safeExtractColumn(column, columnSummary).id}
					</span>
					<span class="ml-[4px] {column.wrapTitle || wrapTitles ? 'ml-[2px]' : ''}">
						{#if sortObj.col === column.id}
							<SortIcon ascending={sortObj.ascending} />
						{:else}
							<span class="invisible"><SortIcon /></span>
						{/if}
					</span>
				</div>
			</th>
		{/each}

		<!-- Extra column for Chevron icons -->
		{#if link}
			<th role="columnheader">
				<span class="sr-only">Links</span>
			</th>
		{/if}
	</tr>
</thead>

<style>
	th {
		white-space: nowrap;
		overflow: hidden;
	}

	th:first-child {
		padding-left: 3px;
	}

	.index {
		color: var(--grey-300);
		text-align: left;
		max-width: -moz-min-content;
		max-width: min-content;
	}

	.string {
		text-align: left;
	}

	.date {
		text-align: left;
	}

	.number {
		text-align: right;
	}

	.boolean {
		text-align: left;
	}
</style>
