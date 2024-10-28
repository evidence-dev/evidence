// @ts-check

import { derived, writable } from 'svelte/store';
import { aggregateColumn, getFinalColumnOrder } from './datatable.js';
import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';

/** @typedef {<T>(fn: () => T) => T | undefined} WrapError */

/**
 * @typedef {Object} ErrorWrapper
 * @property {WrapError} wrapError
 */

/**
 * @typedef {Object} ColumnConfig
 * @property {symbol} identifier
 * @property {string} id
 * @property {string} [title]
 * @property {string} [align]
 * @property {boolean} [wrap]
 * @property {boolean} [wrapTitle]
 * @property {string} [contentType]
 * @property {number} [height]
 * @property {number} [width]
 * @property {string} [alt]
 * @property {boolean} [openInNewTab]
 * @property {string} [linkLabel]
 * @property {string} [fmt]
 * @property {string} [fmtColumn]
 * @property {string} [totalAgg]
 * @property {string} [totalFmt]
 * @property {string} [subtotalFmt]
 * @property {string} [weightCol]
 * @property {boolean} [downIsGood]
 * @property {boolean} [deltaSymbol]
 * @property {boolean} [chip]
 * @property {number} [neutralMin]
 * @property {number} [neutralMax]
 * @property {boolean} [showValue]
 * @property {string} [colorMax]
 * @property {string} [colorMin]
 * @property {string | string[]} scaleColor
 * @property {string} [scaleColumn]
 * @property {string} [colGroup]
 * @property {string} [colorMid]
 * @property {string} [colorBreakpoints]
 * @property {Object} [colorPalette]
 * @property {boolean} [redNegatives]
 */

/**
 * @typedef {Object} DataTablePropStore
 * @property {Record<string, unknown>[]} data
 * @property {ColumnConfig[]} columns
 * @property {string[]} priorityColumns
 */

/**
 * @typedef {Object} NonStoreAggDependents
 * @property {Record<string, unknown>[]} data
 * @property {string} groupBy
 * @property {boolean} groupsOpen
 */

/**
 * @typedef {Object} StoreAggDependents
 * @property {import("svelte/store").Readable<(import("@evidence-dev/component-utilities/getColumnSummary").ColumnSummary & { id: string })[]>} columnSummary
 * @property {import("svelte/store").Readable<DataTablePropStore>} props
 * @property {import("svelte/store").Readable<{ col: string | null; ascending: boolean | null; }>} sortBy
 */

/** @typedef {Record<string, Record<string, unknown>[]>} GroupedData */

/**
 * @param {StoreAggDependents & NonStoreAggDependents} param0
 */
export function aggregateStores({
	columnSummary,
	props,
	sortBy,
	data: _data,
	groupBy: _groupBy,
	groupsOpen: _groupsOpen
}) {
	const data = writable(_data);
	const groupBy = writable(_groupBy);
	const groupsOpen = writable(_groupsOpen);

	const groupedData = derived(
		[data, groupBy],
		([$data, $groupBy]) =>
			/** @type {GroupedData} */ (
				$data.reduce((acc, row) => {
					const groupName = /** @type {string} */ (row[$groupBy]);
					acc[groupName] ??= [];
					acc[groupName].push(row);
					return acc;
				}, {})
			)
	);

	const groupRowData = derived(
		[groupedData, columnSummary, props],
		([$groupedData, $columnSummary, $props]) =>
			Object.keys($groupedData).reduce((acc, groupName) => {
				acc[groupName] = {}; // Initialize groupRow object for this group

				for (const col of $props.columns) {
					const id = col.id;
					const colType = $columnSummary.find((d) => d.id === id)?.type ?? 'string';
					const totalAgg = col.totalAgg;
					const weightCol = col.weightCol;
					const rows = $groupedData[groupName];
					acc[groupName][id] = aggregateColumn(rows, id, totalAgg, colType, weightCol);
				}

				return acc;
			}, /** @type {Record<string, Record<string, string | number>>} */ ({}))
	);

	/** @type {Record<string, boolean>} */
	let previousToggleStates = {};
	const groupToggleStates = derived([groupedData, groupsOpen], ([$groupedData, $groupsOpen]) => {
		const existingGroups = Object.keys(previousToggleStates);
		for (const groupName of Object.keys($groupedData)) {
			if (!existingGroups.includes(groupName)) {
				previousToggleStates[groupName] = $groupsOpen; // Only add new groups with the default state
			}
			// Existing states are untouched
		}
		return previousToggleStates;
	});

	const sortedGroupNames = derived(
		[groupRowData, sortBy, groupedData],
		([$groupRowData, $sortBy, $groupedData]) => {
			if (groupBy && $sortBy.col) {
				const col = $sortBy.col;
				// Sorting groups based on aggregated values or group names
				return Object.entries($groupRowData)
					.sort((a, b) => {
						const valA = a[1][col],
							valB = b[1][col];
						// Use the existing sort logic but apply it to groupRowData's values
						if (
							(valA === undefined || valA === null || Number.isNaN(valA)) &&
							valB !== undefined &&
							valB !== null &&
							!Number.isNaN(valB)
						) {
							return -1 * ($sortBy.ascending ? 1 : -1);
						}
						if (
							(valB === undefined || valB === null || Number.isNaN(valB)) &&
							valA !== undefined &&
							valA !== null &&
							!Number.isNaN(valA)
						) {
							return 1 * ($sortBy.ascending ? 1 : -1);
						}
						if (valA < valB) {
							return -1 * ($sortBy.ascending ? 1 : -1);
						} else if (valA > valB) {
							return 1 * ($sortBy.ascending ? 1 : -1);
						}
						return 0;
					})
					.map((entry) => entry[0]); // Extract sorted group names
			} else {
				// Default to alphabetical order of group names or another criterion when not sorting by a specific column
				return Object.keys($groupedData).sort();
			}
		}
	);

	return {
		/** @param {NonStoreAggDependents} param0 */
		update: ({ data: _data, groupBy: _groupBy, groupsOpen: _groupsOpen }) => {
			data.set(_data);
			groupBy.set(_groupBy);
			groupsOpen.set(_groupsOpen);
		},
		groupedData,
		groupRowData,
		groupToggleStates,
		sortedGroupNames
	};
}

/** @param {Record<string, unknown>[]} data @param {string[]} selectedCols */
function dataSubset(data, selectedCols) {
	return data.map((obj) => {
		const ret = /** @type {Record<string, unknown>} */ ({});
		for (const key of selectedCols) {
			ret[key] = obj[key];
		}
		return ret;
	});
}

/**
 * @typedef {Object} NonStoreTableDependents
 * @property {Record<string, unknown>[]} data
 * @property {number} rows
 * @property {string} [link]
 * @property {boolean} [showLinkCol]
 */

/**
 * @typedef {Object} StoreTableDependents
 * @property {import("svelte/store").Readable<DataTablePropStore>} props
 */

/** @param {ErrorWrapper & StoreTableDependents & NonStoreTableDependents} param0 */
export function tableStateStores({
	wrapError,
	data: _data,
	rows: _rows,
	link: _link,
	showLinkCol: _showLinkCol,
	props
}) {
	const data = writable(_data);
	const rows = writable(_rows);
	/** @type {import("svelte/store").Writable<string | undefined>} */
	const link = writable(_link);
	/** @type {import("svelte/store").Writable<boolean | undefined>} */
	const showLinkCol = writable(_showLinkCol);

	const columnSummary = derived([data, link, showLinkCol], ([$data, $link, $showLinkCol]) => {
		const summary = wrapError(() => getColumnSummary($data, 'array'));
		if (!summary) return [];

		for (let i = 0; i < summary.length; i++) {
			summary[i].show = $showLinkCol === false && summary[i].id === $link ? false : true;
		}
		if (link) {
			const linkColIndex = summary.findIndex((d) => d.id === $link);
			if (linkColIndex !== -1 && !$showLinkCol) {
				summary.splice(linkColIndex, 1);
			}
		}

		const dateCols = summary.filter(
			(d) => d.type === 'date' && !($data[0]?.[d.id] instanceof Date)
		);
		for (const col of dateCols) {
			$data = convertColumnToDate($data, col.id);
		}

		return summary;
	});

	const finalColumnOrder = derived([props], ([$props]) =>
		getFinalColumnOrder(
			$props.columns.map((d) => d.id),
			$props.priorityColumns
		)
	);

	const orderedColumns = derived([props, finalColumnOrder], ([$props, $finalColumnOrder]) =>
		[...$props.columns].sort(
			(a, b) => $finalColumnOrder.indexOf(a.id) - $finalColumnOrder.indexOf(b.id)
		)
	);

	const index = writable(0);

	/** @type {import("svelte/store").Writable<number | null>} */
	const inputPage = writable(null);
	const inputPageElWidth = derived(
		[inputPage],
		([$inputPage]) => `${($inputPage ?? 1).toString().length}ch`
	);

	const filteredData = writable(_data);
	const totalRows = derived([filteredData], ([$filteredData]) => $filteredData.length);

	const currentPage = derived([index, rows], ([$index, $rows]) =>
		Math.ceil(($index + $rows) / $rows)
	);
	const currentPageElWidth = derived(
		[currentPage],
		([$currentPage]) => `${($currentPage ?? 1).toString().length}ch`
	);

	const displayedData = derived([filteredData, index, rows], ([$filteredData, $index, $rows]) =>
		$filteredData.slice($index, $index + $rows)
	);
	const pageCount = derived([filteredData, rows], ([$filteredData, $rows]) =>
		Math.ceil($filteredData.length / $rows)
	);

	const tableData = derived([data, props], ([$data, $props]) =>
		dataSubset(
			$data,
			$props.columns.map((d) => d.id)
		)
	);

	return {
		/** @param {NonStoreTableDependents} param0 */
		update({ data: _data, rows: _rows, link: _link, showLinkCol: _showLinkCol }) {
			data.set(_data);
			rows.set(_rows);
			link.set(_link);
			showLinkCol.set(_showLinkCol);
		},
		index,
		inputPage,
		inputPageElWidth,
		currentPage,
		currentPageElWidth,
		displayedData,
		pageCount,
		tableData,
		columnSummary,
		orderedColumns,
		totalRows,
		filteredData
	};
}
