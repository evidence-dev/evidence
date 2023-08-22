/**
 * Enum for evidence types
 * @readonly
 * @enum {'boolean' | 'number' | 'string' | 'date'}
 */
const EvidenceType = /** @type {const} */ ({
	BOOLEAN: 'boolean',
	NUMBER: 'number',
	STRING: 'string',
	DATE: 'date'
});

/**
 * Enum for evidence type fidelity
 * @readonly
 * @enum {'inferred' | 'precise'}
 */
const TypeFidelity = /** @type {const} */ ({
	INFERRED: 'inferred',
	PRECISE: 'precise'
});

/**
 * @typedef {Object} ColumnDefinition
 * @property {string} name
 * @property {EvidenceType} evidenceType
 * @property {TypeFidelity} typeFidelity
 */

/**
 * Infers the evidence type of a column value
 * @param {unknown} columnValue
 * @returns {EvidenceType}
 */
const inferValueType = function (columnValue) {
	if (typeof columnValue === 'number') {
		return EvidenceType.NUMBER;
	} else if (typeof columnValue === 'boolean') {
		return EvidenceType.BOOLEAN;
	} else if (typeof columnValue === 'string') {
		/** @type {EvidenceType} */
		let result = EvidenceType.STRING;
		if (columnValue && (columnValue.match(/-/g) || []).length === 2) {
			let testDateStr = columnValue;
			if (!columnValue.includes(':')) {
				testDateStr = columnValue + 'T00:00';
			}
			try {
				let testDate = new Date(testDateStr);
				if (testDate.toLocaleString().length > 0) {
					let numCheck = Number.parseInt(testDate.toLocaleString().substring(0, 1));
					if (numCheck != null && !isNaN(numCheck)) {
						result = EvidenceType.DATE;
					}
				}
			} catch (err) {
				//ignore
			}
		}
		return result;
	} else if (columnValue instanceof Date) {
		return EvidenceType.DATE;
	} else {
		return EvidenceType.STRING;
	}
};

/**
 * Infers the evidence type of each column in a set of rows
 * @param {Record<string, unknown>[]} rows
 * @returns {ColumnDefinition[] | undefined}
 */
const inferColumnTypes = function (rows) {
	if (!rows) return undefined;
	if (rows.length === 0) return [];

	const columns = Object.keys(rows[0]);
	const columnTypes = columns.map((column) => {
		const firstRowWithColumnValue = rows.find((element) => element[column] != null);
		const inferredType = firstRowWithColumnValue
			? inferValueType(firstRowWithColumnValue[column])
			: EvidenceType.STRING;
		return { name: column, evidenceType: inferredType, typeFidelity: TypeFidelity.INFERRED };
	});

	return columnTypes;
};

/**
 *
 * @param {Record<string, unknown>[]} rows
 * @param {ColumnDefinition[]} columnTypes
 */
function applyColumnTypes(rows, columnTypes) {
	const columns = Object.fromEntries(columnTypes.map((x) => [x.name, x.evidenceType]));
	for (const row of rows) {
		for (const column_name in row) {
			if (columns[column_name] === EvidenceType.BOOLEAN && typeof row[column_name] !== 'boolean') {
				row[column_name] = Boolean(row[column_name]);
			} else if (
				columns[column_name] === EvidenceType.STRING &&
				typeof row[column_name] !== 'string'
			) {
				row[column_name] = JSON.stringify(row[column_name]);
			} else if (
				columns[column_name] === EvidenceType.NUMBER &&
				typeof row[column_name] !== 'number'
			) {
				row[column_name] = Number(row[column_name]);
			} else if (columns[column_name] === EvidenceType.DATE && !(row instanceof Date)) {
				row[column_name] = new Date(row[column_name]);
			}
		}
	}
	return rows;
}

/**
 *
 * @param {Record<string, unknown>[]} results
 * @param {ColumnDefinition[]} columns
 * @returns {Record<string, unknown>[]}
 */
function stringifyNonstringColumns(results, columns) {
	// fast paths if processing isn't necessary
	// if no column is an evidence string
	if (columns.every(({ evidenceType }) => evidenceType !== EvidenceType.STRING)) return results;
	// if every column that is an evidence string, is a string
	if (
		results.length > 0 &&
		columns
			.filter(({ evidenceType }) => evidenceType === EvidenceType.STRING)
			.every(({ name }) => typeof results[0][name] === 'string')
	)
		return results;

	for (const row of results) {
		for (const { name } of columns.filter(
			({ evidenceType }) => evidenceType === EvidenceType.STRING
		)) {
			if (row[name] instanceof Buffer) {
				row[name] = row[name].toString();
			} else if (typeof row[name] === 'object') {
				row[name] = JSON.stringify(row[name]);
			} else if (typeof row[name] !== 'string') {
				row[name] = String(row[name]);
			}
		}
	}
	return results;
}

/**
 * Processes query results
 * @param {QueryResult | QueryResult["rows"]} queryResults
 * @returns {QueryResult}
 */
const processQueryResults = function (queryResults) {
	const unprocessed_rows = queryResults.rows ?? queryResults;
	const columnTypes = queryResults.columnTypes ?? inferColumnTypes(unprocessed_rows);

	return { rows: applyColumnTypes(unprocessed_rows, columnTypes), columnTypes };
};

exports.EvidenceType = EvidenceType;
exports.TypeFidelity = TypeFidelity;
exports.processQueryResults = processQueryResults;
exports.inferColumnTypes = inferColumnTypes;
exports.applyColumnTypes = applyColumnTypes;
exports.stringifyNonstringColumns = stringifyNonstringColumns;

exports.getEnv = require('./src/getEnv.cjs').getEnv;
