import inferColumnTypes from './inferColumnTypes.js';

/**
 *
 * @param {import("./types.js").QueryStoreValue} data
 * @param {keyof data[number]} [column]
 * @returns {import('./types.js').EvidenceTypeDescriptor | undefined}
 */
export default function getColumnEvidenceType(data, column) {
	if (!data || !column) return undefined;

	if (data._evidenceColumnTypes) {
		const columnTypes = data._evidenceColumnTypes;
		return columnTypes.find((item) => item.name?.toLowerCase() === column.toLowerCase());
	}

	const columnTypes = inferColumnTypes(data);
	return columnTypes?.find((item) => item.name?.toLowerCase() === column.toLowerCase());
}
