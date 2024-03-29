<script>
	import SortIcon from '../../ui/SortIcon.svelte';
	import { safeExtractColumn } from './datatable.js';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	const props = getContext(propKey);

	export let rowNumbers;
	export let headerColor;
	export let headerFontColor;
	export let finalColumnOrder;
	export let columnSummary;
	export let sortable;
	export let sort;
	export let formatColumnTitles;
	export let sortBy;
</script>

<thead>
	<tr class="border-b border-gray-600">
		{#if rowNumbers}
			<th class="index w-[2%] px-[8px] py-[2px]" style:background-color={headerColor} />
		{/if}
		{#if $props.columns.length > 0}
			{#each $props.columns.sort((a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)) as column}
				<th
					class="{safeExtractColumn(column, columnSummary).type} px-[8px] py-[2px]"
					style:text-align={column.align}
					style:color={headerFontColor}
					style:background-color={headerColor}
					style:cursor={sortable ? 'pointer' : 'auto'}
					on:click={sortable ? sort(column.id) : ''}
				>
					{column.title
						? column.title
						: formatColumnTitles
							? safeExtractColumn(column, columnSummary).title
							: safeExtractColumn(column, columnSummary).id}
					{#if sortBy.col === column.id}
						<SortIcon ascending={sortBy.ascending} />
					{/if}
				</th>
			{/each}
		{:else}
			{#each columnSummary
				.filter((d) => d.show === true)
				.sort((a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)) as column}
				<th
					class="{column.type} px-[8px] py-[2px]"
					style:color={headerFontColor}
					style:background-color={headerColor}
					style:cursor={sortable ? 'pointer' : 'auto'}
					on:click={sortable ? sort(column.id) : ''}
				>
					<span class="col-header">
						{formatColumnTitles ? column.title : column.id}
					</span>
					{#if sortBy.col === column.id}
						<SortIcon ascending={sortBy.ascending} />
					{/if}
				</th>
			{/each}
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
