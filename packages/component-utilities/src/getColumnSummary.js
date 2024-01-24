import getColumnEvidenceType from './getColumnEvidenceType.js';
import { getColumnUnitSummary } from './getColumnExtents.js';
import { lookupColumnFormat } from './formatting.js';
import formatTitle from './formatTitle.js';

/**
 * @typedef {Object} ColumnSummary
 * @property {string} title
 * @property {string} type
 * @property {Object} evidenceColumnType
 * @property {ReturnType<typeof lookupColumnFormat>} format
 * @property {ReturnType<typeof getColumnUnitSummary>} columnUnitSummary
 */

/**
 * @function
 * @template T
 * @param {Record<string, unknown>[]} data
 * @param {T} returnType
 * @returns {T extends 'object' ? Record<string, ColumnSummary> : (ColumnSummary & { id: string })[]}
 */
export default function getColumnSummary(data, returnType = 'object') {
	/** @type {Record<string, ColumnSummary>} */
	const columnSummary = {};

	for (const colName of Object.keys(data[0])) {
		const evidenceColumnType = getColumnEvidenceType(data, colName);
		const type = evidenceColumnType.evidenceType;
		const columnUnitSummary =
			evidenceColumnType.evidenceType === 'number'
				? getColumnUnitSummary(data, colName)
				: {
						maxDecimals: 0,
						unitType: evidenceColumnType.evidenceType
				  };
		const format = lookupColumnFormat(colName, evidenceColumnType, columnUnitSummary);
		const sum = 
			evidenceColumnType.evidenceType === 'number'
				? data.reduce((acc, row) => acc + (row[colName] ?? 0), 0)
				: null;
		const mean = 
			evidenceColumnType.evidenceType === 'number'
				? sum / data.length
				: null;
		const median =
			evidenceColumnType.evidenceType === 'number'
				? data.map(row => row[colName]).sort((a, b) => a - b)[Math.floor(data.length / 2)]
				: null;
		const min = 
			evidenceColumnType.evidenceType === 'number'
				? data.reduce((acc, row) => Math.min(acc, row[colName] ?? Infinity), Infinity)
				: null;
		const max =
			evidenceColumnType.evidenceType === 'number'
				? data.reduce((acc, row) => Math.max(acc, row[colName] ?? -Infinity), -Infinity)
				: null;


		columnSummary[colName] = {
			title: formatTitle(colName, format),
			type,
			evidenceColumnType,
			format,
			columnUnitSummary,
			sum,
			mean,
			median,
			min,
			max
		};
	}

	if (returnType !== 'object') {
		return Object.entries(columnSummary).map(([key, value]) => ({ id: key, ...value }));
	}

	return columnSummary;
}
