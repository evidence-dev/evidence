import getColumnEvidenceType from './getColumnEvidenceType.js';
import { getColumnUnitSummary } from './getColumnExtents.js';
import { lookupColumnFormat } from './formatting.js';
import formatTitle from './formatTitle.js';

/**
 * @function
 * @template {'object' | 'array'} T
 * @param {import("./types.js").QueryStoreValue} data
 * @param {T} returnType
 * @returns {T extends 'object' ? Record<string, import('./types.js').ColumnSummary> : (import('./types.js').ColumnSummary & { id: string })[]}
 */
export default function getColumnSummary(data, returnType = /** @type {T} */ ('object')) {
	/** @type {Record<string, import('./types.js').ColumnSummary>} */
	const columnSummary = {};

	for (const colName of Object.keys(data[0])) {
		const evidenceColumnType = /** @type {import("./types.js").EvidenceTypeDescriptor} */ (
			getColumnEvidenceType(data, colName)
		);
		const type = evidenceColumnType.evidenceType;
		const columnUnitSummary = getColumnUnitSummary(data, colName);
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
