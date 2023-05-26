<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { blur, slide } from 'svelte/transition';
	import DownloadData from '../DownloadData.svelte';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import { throttle } from 'echarts';

	export let queryID;
	export let data;

	$: columnSummary = getColumnSummary(data, 'array');
	$: columnWidths = 90 / (columnSummary.length + 1);

	// Slicer
	let index = 0;
	let size = 5;
	$: max = Math.max(data.length - size, 0);
	$: dataPage = data.slice(index, index + size);
	let updatedSlice;

	function slice() {
		updatedSlice = data.slice(index, index + size);
		dataPage = updatedSlice;
	}

	const updateIndex = throttle((event) => {
		index = Math.min(Math.max(0, index + Math.floor(event.deltaY / Math.abs(event.deltaY))), max);
		slice();
	}, 60);

	function handleWheel(event) {
		// abort if scroll is in x-direction
		if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
			return;
		}

		const hasScrolledToTop = event.deltaY < 0 && index === 0;
		const hasScrolledToBottom = event.deltaY > 0 && index === max;

		if (hasScrolledToTop || hasScrolledToBottom) {
			return;
		}

		event.preventDefault();
		updateIndex(event);
	}
</script>

<div class="results-pane" transition:slide|local>
	<div class="container">
		<table in:blur>
			<thead>
				<tr>
					<th class="index" style="width:10%" />
					{#each columnSummary as column}
						<th
							class={column.type}
							style="width:{columnWidths}%"
							evidenceType={column.evidenceColumnType?.evidenceType || 'unavailable'}
							evidenceTypeFidelity={column.evidenceColumnType?.typeFidelity || 'unavailable'}
						>
							{column.id}
						</th>
					{/each}
				</tr><tr />
				<tr class="type-indicator">
					<th class="index type-indicator" style="width:10%" />
					{#each columnSummary as column}
						<th
							class="{column.type} type-indicator"
							style="width:{columnWidths}%"
							evidenceType={column.evidenceColumnType?.evidenceType || 'unavailable'}
							evidenceTypeFidelity={column.evidenceColumnType?.typeFidelity || 'unavailable'}
						>
							{column.type}
						</th>
					{/each}
				</tr><tr />
			</thead>
			<tbody on:wheel={handleWheel}>
				{#each dataPage as row, i}
					<tr>
						<td class="index" style="width:10%">
							{#if i === 0}
								<!-- <input type="number" bind:value={index} max={max} min=0 on:input={slice} class="index-key" autofocus reversed> -->
								{(index + i + 1).toLocaleString()}
							{:else}
								{(index + i + 1).toLocaleString()}
							{/if}
						</td>
						{#each Object.values(row) as cell, j}
							{#if cell == null}
								<td class="null {columnSummary[j].type}" style="width:{columnWidths}%">
									{'Ø'}
								</td>
							{:else if columnSummary[j].type === 'number'}
								<td class="number" style="width:{columnWidths}%;">
									{formatValue(cell, columnSummary[j].format, columnSummary[j].columnUnitSummary)}
								</td>
							{:else if columnSummary[j].type === 'date'}
								<td
									class="string"
									style="width:{columnWidths}%"
									title={formatValue(
										cell,
										columnSummary[j].format,
										columnSummary[j].columnUnitSummary
									)}
								>
									<div>
										{formatValue(cell, columnSummary[j].format, columnSummary[j].columnUnitSummary)}
									</div>
								</td>
							{:else if columnSummary[j].type === 'string'}
								<td class="string" style="width:{columnWidths}%" title={cell}>
									<div>
										{cell || 'Ø'}
									</div>
								</td>
							{:else if columnSummary[j].type === 'boolean'}
								<td class="boolean" style="width:{columnWidths}%" title={cell}>
									<div>
										{cell ?? 'Ø'}
									</div>
								</td>
							{:else}
								<td class="other" style="width:{columnWidths}%">
									{cell || 'Ø'}
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if max > 0}
		<div class="pagination">
			<input type="range" {max} step="1" bind:value={index} on:input={slice} class="slider" />
			<span>
				{(index + size).toLocaleString()} of {(max + size).toLocaleString()}
			</span>
		</div>
	{/if}

	<div class="footer">
		<DownloadData class="download-button" {data} {queryID} display />
	</div>
</div>

<style>
	div.pagination {
		padding: 0px 5px;
		align-content: center;
		border-bottom: 1px solid var(--grey-200);
		height: 1.25em;
		background-color: white;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.slider {
		-webkit-appearance: none;
		width: 75%;
		height: 10px;
		margin: 0 0;
		background: var(--blue-100);
		outline: none;
		opacity: 0.7;
		-webkit-transition: 0.2s;
		transition: opacity 0.2s;
		border-radius: 10px;
		display: inline-block;
		cursor: pointer;
	}

	.slider:hover {
		opacity: 1;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		background: var(--blue-500);
		cursor: pointer;
		border-radius: 10px;
	}

	.slider::-moz-range-thumb {
		width: 10px;
		height: 10px;
		background: var(--blue-500);
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 10px;
		height: 10px;
		background: var(--blue-500);
		cursor: pointer;
	}

	span {
		font-family: var(--ui-font-family-compact);
		-webkit-font-smoothing: antialiased;
		font-size: calc(1em - 6px);
		float: right;
	}

	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}

	.container {
		width: 100%;
		overflow-x: auto;
		border-bottom: 1px solid var(--grey-200);
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
		background-color: white;
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

	.results-pane :global(.download-button) {
		margin-top: 10px;
	}

	table {
		width: 100%;
		font-size: calc(1em - 7px);
		border-collapse: collapse;
		font-family: var(--ui-font-family);
		font-variant-numeric: tabular-nums;
	}

	th {
		font-weight: bold;
		/* border-bottom: thin solid lightgray; */
		padding: 0px 8px;
	}

	td {
		padding: 2px 8px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	td div {
		width: 100px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.other {
		text-align: left;
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

	.null {
		color: var(--grey-300);
	}

	.index {
		color: var(--grey-300);
		text-align: left;
		max-width: min-content;
	}

	th.type-indicator {
		color: var(--grey-400);
		font-weight: normal;
		font-style: italic;
	}

	tr.type-indicator {
		border-bottom: 1px solid var(--grey-100);
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		font-size: 12px;
	}
</style>
