<script>
    import { createEventDispatcher } from 'svelte';
    import TableChevronToggle from './TableChevronToggle.svelte'
    import Delta from './Delta.svelte';
    import { safeExtractColumn } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	$: props = getContext(propKey);

    export let groupName;
    export let currentGroup; // summarizedGroups[groupName]
    export let toggled;
    export let columnSummary;
    export let rowNumbers;
    export let backgroundColor = undefined;

    const dispatch = createEventDispatcher();

    function toggleGroup() {
        dispatch('toggle', { groupName });
    }

</script>

<tr
    on:click={toggleGroup}
    class="cursor-pointer hover:bg-gray-100 w-full border-t-[1px] border-gray-200" 
    role="button" 
    tabindex="0"
    on:keypress={(e) => e.key === 'Enter' && toggleGroup()}
    style:background-color={backgroundColor}
>
<!-- {#if rowNumbers}
<td class="index w-[2%]" />
{/if} -->

{#each $props.columns.length > 0 ? $props.columns : columnSummary.filter((d) => d.show === true) as column, j}
    {@const format = column.totalFmt
        ? getFormatObjectFromString(column.totalFmt)
        : column.fmt
        ? getFormatObjectFromString(column.fmt)
        : columnSummary.format}
    {@const useCol = safeExtractColumn(column, columnSummary)}
    {@const column_format = column.fmt
        ? getFormatObjectFromString(
            column.fmt,
                useCol.format?.valueType
          )
        : useCol.format}
        {#if j === 0}
            <td class="font-medium" colspan={rowNumbers ? 2 : 1} style="padding: 3px;">
                <div class="items-center gap-2 align-top">
                    <span class="inline-flex print-hidden chev"><TableChevronToggle {toggled}/></span> {groupName}
                </div>
            </td>
        {:else}
        <td 
            class="{columnSummary[j].type} font-medium"
            >
            {#if column.contentType === 'delta'}
            <Delta
            value={currentGroup[column.id]}
            downIsGood={column.downIsGood}
            format={column_format}
            columnUnitSummary={useCol.columnUnitSummary}
            showValue={column.showValue}
            deltaSymbol={column.deltaSymbol}
            align={column.align}
        />
        {:else}
                {formatValue(
                    currentGroup[column.id],
                    format,
                    useCol.columnUnitSummary
                )}
            {/if}
        </td>
        {/if}
    {/each}
</tr>

<style>
    th,
td {
    padding: 2px 8px;
    white-space: nowrap;
    overflow: hidden;
}

th:first-child,
td:first-child {
    padding-left: 4px;
}
th {
    border-bottom: 1px solid var(--grey-600);
}

.row-lines {
    border-bottom: thin solid var(--grey-200);
}

.shaded-row {
    background-color: var(--grey-100);
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

.sort-icon {
    width: 12px;
    height: 12px;
    vertical-align: middle;
}

.icon-container {
    display: inline-flex;
    align-items: center;
}

.page-changer {
    padding: 0;
    color: var(--grey-400);
    height: 1.1em;
    width: 1.1em;
}

.index {
    color: var(--grey-300);
    text-align: left;
    max-width: -moz-min-content;
    max-width: min-content;
}

.pagination {
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 2em;
    font-family: var(--ui-font-family);
    color: var(--grey-500);
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    text-align: right;
    margin-top: 0.5em;
    margin-bottom: 1.8em;
    font-variant-numeric: tabular-nums;
}

.page-labels {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 3px;
}

.selected {
    background: var(--grey-200);
    border-radius: 4px;
}

.page-changer {
    font-size: 20px;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 200ms;
}

.page-changer.hovering {
    color: var(--blue-600);
    transition: color 200ms;
}

.page-changer:disabled {
    cursor: auto;
    color: var(--grey-300);
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    transition: color 200ms;
}

.page-icon {
    height: 1em;
    width: 1em;
}

.page-input {
    width: 23px;
    text-align: center;
    padding: 0;
    margin: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 12px;
    color: var(--grey-500);
}

.table-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin: 10px 0px;
    font-size: 12px;
    height: 9px;
}

/* Remove number buttons in input box*/
.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Firefox */
.page-input[type='number'] {
    -moz-appearance: textfield;
    -webkit-appearance: textfield;
    appearance: textfield;
}

.page-input.hovering {
    border: 1px solid var(--grey-200);
}

.page-input.error {
    border: 1px solid var(--red-600);
}

.page-input::-moz-placeholder {
    color: var(--grey-500);
}

.page-input::placeholder {
    color: var(--grey-500);
}

button:enabled > .page-icon:hover {
    color: var(--blue-800);
}

*:focus {
    outline: none;
}

::-moz-placeholder {
    /* Chrome, Firefox, Opera, Safari 10.1+ */
    color: var(--grey-400);
    opacity: 1; /* Firefox */
}

::placeholder {
    /* Chrome, Firefox, Opera, Safari 10.1+ */
    color: var(--grey-400);
    opacity: 1; /* Firefox */
}

:-ms-input-placeholder {
    /* Internet Explorer 10-11 */
    color: var(--grey-400);
}

::-ms-input-placeholder {
    /* Microsoft Edge */
    color: var(--grey-400);
}

th.type-indicator {
    color: var(--grey-400);
    font-weight: normal;
    font-style: italic;
}

.row-link {
    cursor: pointer;
}

.row-link:hover {
    --tw-bg-opacity: 1;
    background-color: rgb(239 246 255 / var(--tw-bg-opacity));
}

.noresults {
    display: none;
    color: var(--grey-400);
    text-align: center;
    margin-top: 5px;
}

.shownoresults {
    display: block;
}

.print-page-count {
    display: none;
}

@media (max-width: 600px) {
    .page-changer {
        height: 1.2em;
        width: 1.2em;
    }
    .page-icon {
        height: 1.2em;
        width: 1.2em;
    }

    .page-count {
        font-size: 1.1em;
    }

    .page-input {
        font-size: 1.1em;
    }
}

@media print {
    .avoidbreaks {
        -moz-column-break-inside: avoid;
        break-inside: avoid;
    }

    .pagination {
        -moz-column-break-inside: avoid;
        break-inside: avoid;
    }

    .page-changer {
        display: none;
    }

    .page-count {
        display: none;
    }

    .print-page-count {
        display: inline;
    }

    .chev{
        display: none;
    }
}
</style>