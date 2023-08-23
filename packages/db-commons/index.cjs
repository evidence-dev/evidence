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
 * Checks if all the columns of type `evidenceType` in a set of rows
 * conform to the proper `typeof` or `instanceof`
 * @param {Record<string, unknown>[]} rows
 * @param {ColumnDefinition[]} columns
 * @param {EvidenceType} evidenceType
 * @returns {boolean}
 */
function conformsTo(rows, columns, evidenceType) {
	if (columns.every(({ evidenceType: columnType }) => columnType !== evidenceType)) return true;
	if (rows.length === 0) return true;

	const firstRow = rows[0];
	const columnsUnderInvestigation = columns.filter(
		({ evidenceType: columnType }) => columnType === evidenceType
	);

	switch (evidenceType) {
		case EvidenceType.STRING:
			return columnsUnderInvestigation.every(({ name }) => typeof firstRow[name] === 'string');
		case EvidenceType.NUMBER:
			return columnsUnderInvestigation.every(({ name }) => typeof firstRow[name] === 'number');
		case EvidenceType.BOOLEAN:
			return columnsUnderInvestigation.every(({ name }) => typeof firstRow[name] === 'boolean');
		case EvidenceType.DATE:
			return columnsUnderInvestigation.every(({ name }) => firstRow[name] instanceof Date);
	}
}

/**
 *
 * @param {Record<string, unknown>[]} results
 * @param {ColumnDefinition[]} columns
 * @returns {Record<string, unknown>[]}
 */
function convertStringColumns(results, columns) {
	if (conformsTo(results, columns, EvidenceType.STRING)) return results;

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
 *
 * @param {Record<string, unknown>[]} rows
 * @param {import('@evidence-dev/db-commons').ColumnDefinition[]} columns
 */
function convertNumberColumns(results, columns) {
	if (conformsTo(results, columns, EvidenceType.NUMBER)) return results;

	for (const row of results) {
		for (const { name } of columns.filter(
			({ evidenceType }) => evidenceType === EvidenceType.NUMBER
		)) {
			if (typeof row[name] !== 'number') {
				row[name] = Number(row[name]);
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

const assert = require('uvu/assert');
/**
 *
 * @param {QueryResult} results
 * @param {EvidenceType[]} expectedColumnTypes
 * @param {string[]} expectedColumnNames
 */
function testQueryResults(results, expectedColumnTypes, expectedColumnNames) {
	const actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
	const actualColumnNames = results.columnTypes.map((columnType) => columnType.name);
	const rows = Object.values(results.rows[0]);

	assert.equal(
		true,
		expectedColumnTypes.length === actualColumnTypes.length &&
			expectedColumnTypes.every((value, index) => value === actualColumnTypes[index]),
		'expected column types to match'
	);
	assert.equal(
		true,
		expectedColumnNames.length === actualColumnNames.length &&
			expectedColumnNames.every((value, index) => value === actualColumnNames[index]),
		'expected column names to match'
	);

	assert.equal(
		true,
		expectedColumnTypes.length === actualColumnTypes.length &&
			expectedColumnTypes.every((value, index) =>
				value === 'date' ? rows[index] instanceof Date : typeof rows[index] === value
			),
		'expected row value type to match column type'
	);
}

exports.EvidenceType = EvidenceType;
exports.TypeFidelity = TypeFidelity;
exports.processQueryResults = processQueryResults;
exports.inferColumnTypes = inferColumnTypes;
exports.applyColumnTypes = applyColumnTypes;
exports.convertStringColumns = convertStringColumns;
exports.convertNumberColumns = convertNumberColumns;
exports.testQueryResults = testQueryResults;

exports.getEnv = require('./src/getEnv.cjs').getEnv;
