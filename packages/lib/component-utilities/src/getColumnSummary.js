import { getColumnUnitSummary } from './getColumnExtents.js';
import { lookupColumnFormat } from './formatting.js';
import formatTitle from './formatTitle.js';
import inferColumnTypes from './inferColumnTypes.js';
import { EvidenceType, TypeFidelity } from './inferColumnTypes.js';

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

	const types = inferColumnTypes(data);

	for (const colName of Object.keys(data[0])) {
		const evidenceColumnType = types.find(
			(item) => item.name?.toLowerCase() === colName?.toLowerCase()
		) ?? {
			name: colName,
			evidenceType: EvidenceType.NUMBER,
			typeFidelity: TypeFidelity.INFERRED
		};
		const type = evidenceColumnType.evidenceType;
		let columnUnitSummary =
			evidenceColumnType.evidenceType === 'number'
				? getColumnUnitSummary(data, colName, true)
				: getColumnUnitSummary(data, colName, false);

		if (evidenceColumnType.evidenceType !== 'number') {
			columnUnitSummary.maxDecimals = 0;
			columnUnitSummary.unitType = evidenceColumnType.evidenceType;
		}
		const format = lookupColumnFormat(colName, evidenceColumnType, columnUnitSummary);

		columnSummary[colName] = {
			title: formatTitle(colName, format),
			type,
			evidenceColumnType,
			format,
			columnUnitSummary
		};
	}

	if (returnType !== 'object') {
		return Object.entries(columnSummary).map(([key, value]) => ({ id: key, ...value }));
	}

	return columnSummary;
}
