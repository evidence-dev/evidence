<script>
	import { slide } from 'svelte/transition';
    import { DownloadData } from '@evidence-dev/core-components';

	import MdFirstPage from 'svelte-icons/md/MdFirstPage.svelte';
	import MdNavigateBefore from 'svelte-icons/md/MdNavigateBefore.svelte';
	import MdNavigateNext from 'svelte-icons/md/MdNavigateNext.svelte';
	import MdLastPage from 'svelte-icons/md/MdLastPage.svelte';

	// Data, pagination, and row index numbers
	export let data;
	export let rows = 10; // number of rows to show

	$: paginated = data.length > rows;
    $: totalRows = data.length;

	let inputPage = null;

	let displayedData ;

	let max;
    let index = 0;
    $: currentPage = Math.ceil((index + rows) / rows);
	$: goToPage = (pageNumber) => {
		index = pageNumber * rows;
		max = index + rows;
		currentPage = Math.ceil(max / rows);
		if (inputPage) {
			inputPage = Math.ceil(max / rows);
		}
		totalRows = data.length;
		displayedData = data.slice(index, index + rows);
	};

    let pageCount;
    let displayedPageLength = 0;
	$: if (paginated) {
		pageCount = Math.ceil(data.length / rows);
		displayedData = data.slice(index, index + rows);
		displayedPageLength = displayedData.length;
	} else {
		currentPage = 1;
		displayedData = data;
	}

    let hovering = false;
</script>

<div
    class="table-container"
    transition:slide|local
    style="margin-top: 1.5em; margin-bottom: 1em; padding-bottom: 0em"
    on:mouseenter={() => (hovering = true)}
    on:mouseleave={() => (hovering = false)}
>
    <div class="container">
        <table>
            <thead>
                <tr>
                    {#each data.schema.fields as column}
                        <th style="color: var(--grey-900); cursor: pointer;">
                            <span class="col-header">
                                {column.name}
                            </span>
                        </th>
                    {/each}
                </tr>
            </thead>

            {#each Array(data.numRows) as _, row_number}
                {@const row = (_, data.get(row_number))}
                <tr>
                    {#each data.schema.fields as column}
                        <td class="row-lines">
                            {row[column.name]}
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
    </div>

    {#if paginated && pageCount > 1}
        <div class="pagination">
            <div class="page-labels">
                <button
                    aria-label="first-page"
                    class="page-changer"
                    class:hovering
                    disabled={currentPage === 1}
                    on:click={() => goToPage(0)}
                >
                    <div class="page-icon">
                        <MdFirstPage />
                    </div>
                </button>
                <button
                    aria-label="previous-page"
                    class="page-changer"
                    class:hovering
                    disabled={currentPage === 1}
                    on:click={() => goToPage(currentPage - 2)}
                >
                    <div class="page-icon">
                        <MdNavigateBefore />
                    </div>
                </button>
                <span class="page-count">
                    Page <input
                        class="page-input"
                        class:hovering
                        class:error={inputPage > pageCount}
                        type="number"
                        bind:value={inputPage}
                        on:keyup={() => goToPage((inputPage ?? 1) - 1)}
                        on:change={() => goToPage((inputPage ?? 1) - 1)}
                        placeholder={currentPage}
                    />
                    /
                    <span class="page-count" style="margin-left: 4px;">{pageCount.toLocaleString()}</span>
                </span>
                <span class="print-page-count">
                    {displayedPageLength.toLocaleString()} of {totalRows.toLocaleString()} records
                </span>
                <button
                    aria-label="next-page"
                    class="page-changer"
                    class:hovering
                    disabled={currentPage === pageCount}
                    on:click={() => goToPage(currentPage)}
                >
                    <div class="page-icon">
                        <MdNavigateNext />
                    </div>
                </button>
                <button
                    aria-label="last-page"
                    class="page-changer"
                    class:hovering
                    disabled={currentPage === pageCount}
                    on:click={() => goToPage(pageCount - 1)}
                >
                    <div class="page-icon">
                        <MdLastPage />
                    </div>
                </button>
            </div>
            <DownloadData class="download-button" {data} display={hovering} />
        </div>
    {:else}
        <div class="table-footer">
            <DownloadData class="download-button" {data} display={hovering} />
        </div>
    {/if}
</div>

<style>
	.table-container {
		font-size: 9.5pt;
		width: 97%;
	}

	.container {
		width: 100%;
		overflow-x: auto;
		/* border-bottom: 1px solid var(--grey-200);    */
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
		background-color: white;
	}

	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}

	.container::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	.container::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}
	.container::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	.container::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	.container::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	.container::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	table {
		display: table;
		font-family: sans-serif;
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		padding: 2px 8px;
		white-space: nowrap;
		overflow: hidden;
	}

	th {
		border-bottom: 1px solid var(--grey-600);
	}

	.row-lines {
		border-bottom: thin solid var(--grey-200);
	}

	.page-changer {
		padding: 0;
		color: var(--grey-400);
		height: 1.1em;
		width: 1.1em;
	}

	.pagination {
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 2em;
		font-family: var(--ui-font-family);
		color: var(--grey-500);
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

	.page-changer {
		font-size: 20px;
		font-family: sans-serif;
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
		appearance: textfield;
	}

	.page-input.hovering {
		border: 1px solid var(--grey-200);
	}

	.page-input.error {
		border: 1px solid var(--red-600);
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

	th {
		user-select: none;
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
		.pagination {
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
	}
</style>
