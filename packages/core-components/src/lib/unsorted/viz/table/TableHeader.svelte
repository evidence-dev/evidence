<script>
    import SortIcon from '../../ui/SortIcon.svelte';
	import { safeExtractColumn } from './datatable.js';
    import { getContext } from 'svelte';
    import { propKey } from '@evidence-dev/component-utilities/chartContext';
	const props = getContext(propKey);

    export let rowNumbers;
    export let groupType;
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
    <tr>
        {#if rowNumbers && groupType !== 'side'}
            <th class="index w-[2%]" style:background-color={headerColor} />
        {/if}
        {#if $props.columns.length > 0}
            {#each $props.columns.sort((a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)) as column}
                <th
                    class={safeExtractColumn(column, columnSummary).type}
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
            {#each columnSummary.filter((d) => d.show === true).sort((a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)) as column}
                <th
                    class={column.type}
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
		padding: 2px 8px;
		white-space: nowrap;
		overflow: hidden;
	}

	th:first-child {
		padding-left: 4px;
	}
	th {
		border-bottom: 1px solid var(--grey-600);
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