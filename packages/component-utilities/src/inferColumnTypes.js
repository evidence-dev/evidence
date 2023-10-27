// To-do, replace with import from db-commons

import { QueryStore } from '@evidence-dev/query-store';

/**
 *
 * @param {unknown} columnValue
 * @returns {import("./types.js").EvidenceType}
 */
export const inferValueType = function (columnValue) {
	if (typeof columnValue === 'number') {
		return 'number';
	} else if (typeof columnValue === 'boolean') {
		return 'boolean';
	} else if (typeof columnValue === 'string') {
		if (columnValue && columnValue.includes('-')) {
			let testDateStr = columnValue;
			if (!columnValue.includes(':')) {
				testDateStr = columnValue + 'T00:00';
			}
			try {
				const testDate = new Date(testDateStr);
				if (testDate.toLocaleString().length > 0) {
					const numCheck = Number.parseInt(testDate.toLocaleString().substring(0, 1));
					if (numCheck != null && !isNaN(numCheck)) {
						return 'date';
					}
				}
			} catch (err) {
				//ignore
			}
		}
		return 'string';
	} else if (columnValue instanceof Date) {
		return 'date';
	} else {
		return 'string';
	}
};

/**
 *
 * @param {import("./types.js").QueryStoreValue | Record<string, unknown>[]} rows
 * @returns {import("./types.js").EvidenceTypeDescriptor[] | undefined}
 */
export default function inferColumnTypes(rows) {
	if (rows instanceof QueryStore) {
		return rows._evidenceColumnTypes;
	}
	if (rows && rows.length > 0) {
		const columns = Object.keys(rows[0]);
		return columns.map((column) => {
			const firstRowWithColumnValue = rows.find((element) => element[column] != null);
			return {
				name: column,
				evidenceType: firstRowWithColumnValue
					? inferValueType(firstRowWithColumnValue[column])
					: 'string',
				typeFidelity: 'inferred'
			};
		});
	}
	return undefined;
}
