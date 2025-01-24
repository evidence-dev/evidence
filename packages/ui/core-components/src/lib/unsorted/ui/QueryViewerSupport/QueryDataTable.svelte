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

<div class="results-pane py-1" transition:slide|local>
	<div class="scrollbox pretty-scrollbar">
		<table class="text-xs" in:blur>
			<thead>
				<tr>
					<th class="py-0 px-2 font-medium index text-base-content-muted" style="width:10%" />
					{#each columnSummary as column}
						<th
							class="py-0 px-2 font-medium {column.type}"
							style="width:{columnWidths}%"
							evidenceType={column.evidenceColumnType?.evidenceType || 'unavailable'}
							evidenceTypeFidelity={column.evidenceColumnType?.typeFidelity || 'unavailable'}
						>
							{column.id}
						</th>
					{/each}
				</tr><tr />
				<tr class="type-indicator">
					<th
						class="py-0 px-2 index type-indicator text-base-content-muted font-normal"
						style="width:10%"
					/>
					{#each columnSummary as column}
						<th
							class="{column.type} type-indicator text-base-content-muted font-normal py-0 px-2"
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
						<td class="index text-base-content-muted" style="width:10%">
							{#if i === 0}
								<!-- <input type="number" bind:value={index} max={max} min=0 on:input={slice} class="index-key" autofocus reversed> -->
								{(index + i + 1).toLocaleString()}
							{:else}
								{(index + i + 1).toLocaleString()}
							{/if}
						</td>
						{#each columnSummary as column, j}
							{#if row[column.id] == null}
								<td
									class="text-base-content-muted {columnSummary[j].type}"
									style="width:{columnWidths}%"
								>
									{'Ø'}
								</td>
							{:else if columnSummary[j].type === 'number'}
								<td class="number" style="width:{columnWidths}%;">
									{formatValue(
										row[column.id],
										columnSummary[j].format,
										columnSummary[j].columnUnitSummary
									)}
								</td>
							{:else if columnSummary[j].type === 'date'}
								<td
									class="string"
									style="width:{columnWidths}%"
									title={formatValue(
										row[column.id],
										columnSummary[j].format,
										columnSummary[j].columnUnitSummary
									)}
								>
									<div>
										{formatValue(
											row[column.id],
											columnSummary[j].format,
											columnSummary[j].columnUnitSummary
										)}
									</div>
								</td>
							{:else if columnSummary[j].type === 'string'}
								<td class="string" style="width:{columnWidths}%" title={row[column.id]}>
									<div>
										{row[column.id] || 'Ø'}
									</div>
								</td>
							{:else if columnSummary[j].type === 'boolean'}
								<td class="boolean" style="width:{columnWidths}%" title={row[column.id]}>
									<div>
										{row[column.id] ?? 'Ø'}
									</div>
								</td>
							{:else}
								<td class="other" style="width:{columnWidths}%">
									{row[column.id] || 'Ø'}
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
			<input
				type="range"
				{max}
				step="1"
				bind:value={index}
				on:input={slice}
				class="slider bg-info/30 hover:bg-info/40 transition-colors"
			/>
			<span class="text-xs">
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
		border-bottom: 1px solid var(--base-200);
		height: 1.25em;
		background-color: var(--base-100);
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
		outline: none;
		border-radius: 10px;
		display: inline-block;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		background-color: var(--color-info);
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		cursor: pointer;
		border-radius: 10px;
	}

	.slider::-moz-range-thumb {
		background-color: var(--color-info);
		width: 10px;
		height: 10px;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		background-color: var(--color-info);
		width: 10px;
		height: 10px;
		cursor: pointer;
	}

	span {
		font-family: var(--ui-font-family-compact);
		-webkit-font-smoothing: antialiased;
		float: right;
	}

	.scrollbox {
		width: 100%;
		overflow-x: auto;
		border-bottom: 1px solid var(--base-300);
		background-color: var(--base-100);
	}

	.results-pane :global(.download-button) {
		margin-top: 10px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--ui-font-family);
		font-variant-numeric: tabular-nums;
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

	.index {
		text-align: left;
		max-width: min-content;
	}

	tr.type-indicator {
		border-bottom: 1px solid var(--base-300);
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		font-size: 12px;
	}
</style>
