// To-do, replace with import from db-commons

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
		const result = 'string';
		if (columnValue && columnValue.includes('-')) {
			let testDateStr = columnValue;
			if (!columnValue.includes(':')) {
				testDateStr = columnValue + 'T00:00';
			}
			try {
				let testDate = new Date(testDateStr);
				if (testDate.toLocaleString().length > 0) {
					let numCheck = Number.parseInt(testDate.toLocaleString().substring(0, 1));
					if (numCheck != null && !isNaN(numCheck)) {
						return 'date';
					}
				}
			} catch (err) {
				//ignore
			}
		}
		return result;
	} else if (columnValue instanceof Date) {
		return 'date';
	} else {
		return 'string';
	}
};

export default function inferColumnTypes(rows) {
	if (rows && rows.length > 0) {
		let columns = Object.keys(rows[0]);
		let columnTypes = columns?.map((column) => {
			let firstRowWithColumnValue = rows.find((element) =>
				element[column] == null ? false : true
			);
			if (firstRowWithColumnValue) {
				let inferredType = inferValueType(firstRowWithColumnValue[column]);
				return { name: column, evidenceType: inferredType, typeFidelity: 'inferred' };
			} else {
				return {
					name: column,
					evidenceType: 'string',
					typeFidelity: 'inferred'
				};
			}
		});
		return columnTypes;
	}
	return undefined;
}
