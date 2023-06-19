import getColumnEvidenceType from './getColumnEvidenceType.js';
import { getColumnExtentsLegacy, getColumnUnitSummary } from './getColumnExtents.js';
import { lookupColumnFormat } from './formatting';
import formatTitle from './formatTitle.js';

export default function getColumnSummary(data, returnType = 'object') {
	var colName;
	var colType;
	var evidenceColumnType;
	var colFormat;
	let columnUnitSummary;
	let columnSummary = [];

	var colExtentsLegacy;

	if (returnType === 'object') {
		for (const [key] of Object.entries(data[0])) {
			colName = key;
			evidenceColumnType = getColumnEvidenceType(data, colName);
			colType = evidenceColumnType.evidenceType;
			columnUnitSummary = getColumnUnitSummary(data, colName);
			colFormat = lookupColumnFormat(key, evidenceColumnType, columnUnitSummary);
			colExtentsLegacy = getColumnExtentsLegacy(data, colName);

			let thisCol = {
				[colName]: {
					title: formatTitle(colName, colFormat),
					type: colType,
					evidenceColumnType: evidenceColumnType,
					format: colFormat,
					columnUnitSummary: columnUnitSummary,
					extentsLegacy: colExtentsLegacy
				}
			};
			columnSummary = { ...columnSummary, ...thisCol };
		}
	} else {
		for (const [key] of Object.entries(data[0])) {
			colName = key;
			evidenceColumnType = getColumnEvidenceType(data, colName);
			colType = evidenceColumnType.evidenceType;
			columnUnitSummary = getColumnUnitSummary(data, colName);
			colFormat = lookupColumnFormat(key, evidenceColumnType, columnUnitSummary);
			colExtentsLegacy = getColumnExtentsLegacy(data, colName);

			columnSummary.push({
				id: colName,
				title: formatTitle(colName, colFormat),
				type: colType,
				evidenceColumnType: evidenceColumnType,
				format: colFormat,
				columnUnitSummary: columnUnitSummary,
				extentsLegacy: colExtentsLegacy
			});
		}
	}

	return columnSummary;
}
