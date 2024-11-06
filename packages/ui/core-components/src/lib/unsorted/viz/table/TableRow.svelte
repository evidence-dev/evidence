<script>
	import { goto, preloadData } from '$app/navigation';
	import { safeExtractColumn } from './datatable.js';
	import Delta from '../core/Delta.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import TableCell from './TableCell.svelte';
	import chroma from 'chroma-js';
	import { uiColours } from '@evidence-dev/component-utilities/colours';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronRight } from '@steeze-ui/tabler-icons';
	import Sparkline from '../core/_Sparkline.svelte';
	import { buildUrl } from '@evidence-dev/sdk/utils/svelte';

	export let displayedData = undefined;
	export let rowShading = undefined;
	export let link = undefined;
	export let rowNumbers = undefined;
	export let rowLines = undefined;
	export let index = undefined;
	export let columnSummary = undefined;
	export let grouped = false; // if part of a group - styling will be adjusted
	export let groupType = undefined;
	export let groupColumn = undefined;
	export let rowSpan = undefined;
	export let groupNamePosition = 'middle'; // middle (default) | top | bottom
	export let orderedColumns = undefined;
	export let compact = undefined;

	const isUrlExternal = (url) =>
		new URL(url, window.location.origin).origin !== window.location.origin;

	const preloadLink = async (row) => {
		if (!link || !row[link]) return;
		const url = row[link];

		if (isUrlExternal(url)) return;

		await preloadData(url);
	};

	const navigateToLink = async (row) => {
		if (!link || !row[link]) return;
		const url = row[link];

		if (isUrlExternal(url)) {
			window.location = buildUrl(url);
			return;
		}

		await goto(buildUrl(row[link]));
	};
</script>

{#each displayedData as row, i}
	<tr
		class:shaded-row={rowShading && i % 2 === 1}
		class:row-link={link && row[link]}
		on:mouseover={() => preloadLink(row)}
		on:focus={() => preloadLink(row)}
		on:click={() => navigateToLink(row)}
		class:row-lines={rowLines}
	>
		{#if rowNumbers && groupType !== 'section'}
			<TableCell class={'index w-[2%]'} {compact}>
				{(index + i + 1).toLocaleString()}
			</TableCell>
		{/if}

		{#each orderedColumns as column, k}
			{@const useCol = safeExtractColumn(column, columnSummary)}
			{@const scaleCol = column.scaleColumn
				? columnSummary.find((d) => d.id === column.scaleColumn)
				: useCol}
			{@const column_min = column.colorMin ?? scaleCol.columnUnitSummary?.min}
			{@const column_max = column.colorMax ?? scaleCol.columnUnitSummary?.max}
			{@const is_nonzero =
				column_max - column_min !== 0 && !isNaN(column_max) && !isNaN(column_min)}
			{@const column_format = column.fmt
				? getFormatObjectFromString(column.fmt, useCol.format?.valueType)
				: column.fmtColumn
					? getFormatObjectFromString(row[column.fmtColumn], useCol.format?.valuetype)
					: useCol.format}
			{@const color_domain =
				column.colorBreakpoints ??
				(column.colorMid ? [column_min, column.colorMid, column_max] : [column_min, column_max])}
			{@const color_scale = column.colorPalette
				? chroma.scale(column.colorPalette).domain(color_domain).nodata('white')
				: ''}
			{@const cell_color =
				column.contentType === 'colorscale' && is_nonzero && column.colorPalette
					? column.scaleColumn
						? color_scale(row[column.scaleColumn]).hex()
						: color_scale(row[column.id]).hex()
					: ''}
			{@const font_color = column.redNegatives
				? row[column.id] < 0
					? 'rgb(220 38 38)'
					: ''
				: column.contentType === 'colorscale' && is_nonzero && column.colorPalette
					? chroma.contrast(cell_color, uiColours.grey999) <
						chroma.contrast(cell_color, 'white') + 0.5
						? 'white'
						: uiColours.grey999
					: ''}
			{@const bottom_border =
				i !== displayedData.length - 1 &&
				rowLines &&
				column.contentType === 'colorscale' &&
				is_nonzero &&
				column.colorPalette
					? `1px solid ${chroma(cell_color).darken(0.5)}`
					: ''}
			<TableCell
				class={useCol?.type}
				{compact}
				verticalAlign={groupType === 'section' ? groupNamePosition : undefined}
				rowSpan={groupType === 'section' && groupColumn === useCol.id && i === 0 ? rowSpan : 1}
				show={!(groupType === 'section' && groupColumn === useCol.id && i !== 0)}
				align={column.align}
				paddingLeft={k === 0 && grouped && groupType === 'accordion' && !rowNumbers
					? '28px'
					: undefined}
				height={column.height}
				width={column.width}
				wrap={column.wrap}
				cellColor={cell_color}
				fontColor={font_color}
				borderBottom={bottom_border}
			>
				{#if column.contentType === 'image' && row[column.id] !== undefined}
					<img
						src={row[column.id]}
						alt={column.alt
							? row[column.alt]
							: row[column.id].replace(/^(.*[/])/g, '').replace(/[.][^.]+$/g, '')}
						class="mx-auto my-2 max-w-[unset] rounded-[unset]"
						style:height={column.height}
						style:width={column.width}
					/>
				{:else if column.contentType === 'link' && row[column.id] !== undefined}
					<!-- if `column.linkLabel` is a column in `row`, but undefined, display - -->
					{#if column.linkLabel != undefined && row[column.linkLabel] == undefined && column.linkLabel in row}
						-
					{:else}
						<a
							href={buildUrl(row[column.id])}
							target={column.openInNewTab ? '_blank' : ''}
							class="text-blue-600 hover:text-blue-700 transition-colors duration-200"
						>
							{#if column.linkLabel != undefined}
								<!-- if the linklabel is a column name, display that column -->
								{#if row[column.linkLabel] != undefined}
									{@const labelSummary = safeExtractColumn({ id: column.linkLabel }, columnSummary)}
									{formatValue(
										row[column.linkLabel],
										column.fmt
											? getFormatObjectFromString(column.fmt, labelSummary.format?.valueType)
											: labelSummary.format,
										labelSummary.columnUnitSummary
									)}
									<!-- otherwise, consider it a label (like Details ->) and display it -->
								{:else}
									{column.linkLabel}
								{/if}
							{:else}
								<!-- if no linkLabel is specified, display the link itself -->
								{@const columnSummary = useCol}
								{formatValue(
									row[column.id],
									column.fmt
										? getFormatObjectFromString(column.fmt, columnSummary.format?.valueType)
										: columnSummary.format,
									columnSummary.columnUnitSummary
								)}
							{/if}
						</a>
					{/if}
				{:else if column.contentType === 'delta' && row[column.id] !== undefined}
					<Delta
						value={row[column.id]}
						downIsGood={column.downIsGood}
						format_object={column_format}
						columnUnitSummary={useCol.columnUnitSummary}
						showValue={column.showValue}
						showSymbol={column.deltaSymbol}
						align={column.align}
						fontClass="text-[9.25pt]"
						neutralMin={column.neutralMin}
						neutralMax={column.neutralMax}
						chip={column.chip}
					/>
				{:else if column.contentType === 'bar' && row[column.id] !== undefined}
					{@const total_width =
						column_min >= 0
							? column_max
							: column_max < 0
								? column_min
								: Math.abs(column_min) + column_max}
					<div
						style="width: 100%; background-color: {column.backgroundColor}; position: relative; height: 100%; display: flex; align-items: center; overflow: hidden;"
					>
						<!-- Conditionally render axis line and negative space if any row has negative values -->
						{#if column_min < 0}
							<!-- Axis line in the center -->
							<!-- <div style="width: 0.5px;background-color: #000; position: absolute; left: {column_min < 0 ? (Math.abs(column_min) / (Math.abs(column_min) + column_max)) * 100 : 0}%; top: 0; height: 100%; z-index: 1;"></div> -->

							<!-- Negative bar (if value is negative) -->
							{#if row[column.id] < 0}
								<div
									style="width: {Math.min(
										Math.abs((row[column.id] / total_width) * 100),
										100
									)}%; background-color: {column.negativeBarColor}; height: 100%; position: absolute; right: {(1 -
										Math.abs(column_min) / (Math.abs(column_min) + column_max)) *
										100}%;"
								></div>
							{/if}
						{/if}

						<!-- Positive bar (if value is positive or zero) -->
						{#if row[column.id] >= 0}
							<div
								style="width: {Math.min(
									(row[column.id] / total_width) * 100,
									100
								)}%; background-color: {column.barColor}; height: 100%; position: absolute; left: {column_min <
								0
									? (Math.abs(column_min) / (Math.abs(column_min) + column_max)) * 100 + '%'
									: '0'};"
							></div>
						{/if}

						<!-- Display label -->
						<div
							class:invisible={column.hideLabels}
							style="
								position: relative; 
								z-index: 2; 
								padding-left: 4px; 
								padding-right: 4px; 
								text-align: {column.align ?? 'left'};
								width: {(Math.abs(column_max) /
								((column_min < 0 ? Math.abs(column_min) : 0) + Math.abs(column_max))) *
								100}%;
								left: {column_min < 0 && column_max >= 0
								? (Math.abs(column_min) / (Math.abs(column_min) + column_max)) * 100 + '%'
								: '0'};"
						>
							{formatValue(row[column.id], column_format, useCol.columnUnitSummary)}
						</div>
					</div>

					<!-- <div style="background-color: red; max-width: '{row[column.id] / column_max * 100}%'">{row[column.id]}</div> -->
				{:else if column.contentType === 'sparkline' && row[column.id] !== undefined}
					{@const alignment = column.align ?? 'center'}
					<div class="items-{alignment} justify-{alignment} flex">
						<Sparkline
							type="line"
							data={[...row[column.id]]}
							dateCol={column.sparkX}
							valueCol={column.sparkY}
							interactive="false"
							color={column.sparkColor}
							yScale={column.sparkYScale}
							height={column.sparkHeight ?? 19}
							width={column.sparkWidth ?? 90}
						/>
					</div>
				{:else if column.contentType === 'sparkbar' && row[column.id] !== undefined}
					<div class="items-center justify-center flex">
						<Sparkline
							type="bar"
							data={[...row[column.id]]}
							dateCol={column.sparkX}
							valueCol={column.sparkY}
							interactive="false"
							color={column.sparkColor}
							yScale={column.sparkYScale}
							height={column.sparkHeight ?? 19}
							width={column.sparkWidth ?? 90}
						/>
					</div>
				{:else if column.contentType === 'sparkarea' && row[column.id] !== undefined}
					{@const alignment =
						column.align === 'right' ? 'end' : column.align === 'left' ? 'start' : 'center'}
					<div class="items-center justify-{alignment} flex">
						<Sparkline
							type="area"
							data={[...row[column.id]]}
							dateCol={column.sparkX}
							valueCol={column.sparkY}
							interactive="false"
							color={column.sparkColor}
							yScale={column.sparkYScale}
							height={column.sparkHeight ?? 20}
							width={column.sparkWidth ?? 80}
						/>
					</div>
				{:else if column.contentType === 'html' && row[column.id] !== undefined}
					{@html row[column.id]}
				{:else}
					{formatValue(row[column.id], column_format, useCol.columnUnitSummary)}
				{/if}
			</TableCell>
		{/each}

		{#if link && row[link]}
			<TableCell {compact} width="16px">
				<Icon src={ChevronRight} class="w-4 h-4" />
				<a href={buildUrl(row[link])} class="sr-only">See more</a>
			</TableCell>
		{/if}
	</tr>
{/each}

<style>
	.row-lines {
		border-bottom: thin solid var(--grey-200);
	}

	.shaded-row {
		background-color: var(--grey-50);
	}

	*:focus {
		outline: none;
	}

	.row-link {
		cursor: pointer;
	}

	.row-link:hover {
		--tw-bg-opacity: 1;
		background-color: rgb(239 246 255 / var(--tw-bg-opacity));
	}
</style>
