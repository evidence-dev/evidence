// @ts-check

import { derived, writable } from "svelte/store";
import { aggregateColumn } from "./datatable.js";

/** @typedef {Object} ColumnConfig
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
 * @typedef {Object} NonStoreDependents
 * @property {Record<string, unknown>[]} data
 * @property {string} groupBy
 * @property {boolean} groupsOpen
 */

/** @typedef {Object} StoresDependents
 * @property {import("svelte/store").Readable<(import("@evidence-dev/component-utilities/getColumnSummary").ColumnSummary & { id: string })[]>} columnSummary
 * @property {import("svelte/store").Readable<DataTablePropStore>} props
 * @property {import("svelte/store").Readable<{ col: string | null; ascending: boolean | null; }>} sortBy
 */

/** @typedef {Record<string, Record<string, unknown>[]>} GroupedData */

/**
 * @param {StoresDependents & NonStoreDependents} param0 
 */
export function aggregateStores({ columnSummary, props, sortBy, data: _data, groupBy: _groupBy, groupsOpen: _groupsOpen }) {
	const data = writable(_data);
	const groupBy = writable(_groupBy);
	const groupsOpen = writable(_groupsOpen);

	const groupedData = derived([data, groupBy], ([$data, $groupBy]) =>
		/** @type {GroupedData} */($data.reduce((acc, row) => {
		const groupName = /** @type {string} */ (row[$groupBy]);
		acc[groupName] ??= [];
		acc[groupName].push(row);
		return acc;
	}, {}))
	);

	const groupRowData = derived([groupedData, columnSummary, props], ([$groupedData, $columnSummary, $props]) =>
		Object.keys($groupedData).reduce((acc, groupName) => {
			acc[groupName] = {}; // Initialize groupRow object for this group

			for (const col of $props.columns) {
				const id = col.id;
				const colType = $columnSummary.find((d) => d.id === id)?.type ?? "string";
				const totalAgg = col.totalAgg;
				const weightCol = col.weightCol;
				const rows = $groupedData[groupName];
				acc[groupName][id] = aggregateColumn(rows, id, totalAgg, colType, weightCol);
			}

			return acc;
		}, /** @type {Record<string, Record<string, string | number>>} */({}))
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
		/** @param {NonStoreDependents} param0 */
		update: ({ data: _data, groupBy: _groupBy, groupsOpen: _groupsOpen }) => {
			data.set(_data);
			groupBy.set(_groupBy);
			groupsOpen.set(_groupsOpen);
		},
		groupedData,
		groupRowData,
		groupToggleStates,
		sortedGroupNames,
	};
}