import getColumnEvidenceType from './getColumnEvidenceType.js';
import { getColumnExtentsLegacy, getColumnUnitSummary } from './getColumnExtents.js';
import { lookupColumnFormat } from './formatting';
import formatTitle from './formatTitle.js';

export default function getColumnSummary(data, returnType = 'object') {
	const columnSummary = {};

	for (const colName of Object.keys(data[0])) {
		const evidenceColumnType = getColumnEvidenceType(data, colName);
		const type = evidenceColumnType.evidenceType;
		const columnUnitSummary = getColumnUnitSummary(data, colName);
		const format = lookupColumnFormat(colName, evidenceColumnType, columnUnitSummary);
		const extentsLegacy = getColumnExtentsLegacy(data, colName);

		columnSummary[colName] = {
			title: formatTitle(colName, format),
			type,
			evidenceColumnType,
			format,
			columnUnitSummary,
			extentsLegacy
		};
	}

	if (returnType !== 'object') {
		return Object.entries(columnSummary).map(([key, value]) => ({ id: key, ...value }));
	}

	return columnSummary;
}
