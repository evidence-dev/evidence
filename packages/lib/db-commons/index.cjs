/**
 * Enum for evidence types
 * @readonly
 * @enum {'boolean' | 'number' | 'string' | 'date'}
 */
const EvidenceType = /** @type {const} */ ({
	BOOLEAN: 'boolean',
	NUMBER: 'number',
	STRING: 'string',
	DATE: 'date',
	BIGINT: 'bigint'
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
 * Processes query results
 * @param {QueryResult | QueryResult["rows"]} queryResults
 * @returns {QueryResult}
 */
const processQueryResults = function (queryResults) {
	const rows = queryResults.rows ?? queryResults;
	const columnTypes = queryResults.columnTypes ?? inferColumnTypes(rows);

	return { rows, columnTypes };
};

/**
 * @typedef {Object} AsyncIterableToBatchedAsyncGeneratorOptions
 * @property {(rows: Record<string, unknown>[]) => QueryResult["columnTypes"]} [mapResultsToEvidenceColumnTypes]
 * @property {(row: unknown, columnTypes?: ColumnDefinition[]) => Record<string, unknown>} [standardizeRow]
 * @property {() => void | Promise<void>} [closeConnection]
 */

/**
 * Converts an async iterable to a QueryResult
 * @param {AsyncIterable<unknown>} iterable
 * @param {number} batchSize
 * @param {AsyncIterableToBatchedAsyncGeneratorOptions} options additional optional parameters
 * @returns {Promise<QueryResult>}
 */
const asyncIterableToBatchedAsyncGenerator = async function (
	iterable,
	batchSize,
	{
		// @ts-ignore
		standardizeRow = (x) => x,
		mapResultsToEvidenceColumnTypes,
		closeConnection = () => {}
	} = {}
) {
	/** @type {Record<string, unknown>[]} */
	const preread_rows = [];

	/** @type {QueryResult["columnTypes"]} */
	let columnTypes = [];
	if (mapResultsToEvidenceColumnTypes) {
		const iterator = iterable[Symbol.asyncIterator]();
		const firstRow = await iterator.next().then((x) => x.value);
		const column_names = Object.keys(firstRow);
		preread_rows.push(standardizeRow(firstRow));

		let null_columns = column_names.filter((column) => firstRow[column] == null);
		while (null_columns.length > 0) {
			const next = await iterator.next().then((x) => x.value);
			preread_rows.push(standardizeRow(next));
			null_columns = null_columns.filter((column) => next[column] == null);
		}
		columnTypes = mapResultsToEvidenceColumnTypes(preread_rows);
	}

	const rows = async function* () {
		let batch = [];
		batch.push(...preread_rows.map((row) => standardizeRow(row, columnTypes)));
		for await (const row of iterable) {
			batch.push(standardizeRow(row, columnTypes));
			if (batch.length >= batchSize) {
				yield batch;
				batch = [];
			}
		}
		// No more batches, safe to close connection now
		await closeConnection();
		if (batch.length > 0) {
			yield batch;
		}
		// Clean up
	};

	return { rows, columnTypes };
};

/**
 * Converts an async generator to an array
 * @param {() => AsyncIterable<Array<Record<string, unknown>>>} asyncGenerator
 * @returns {Promise<Record<string, unknown>[]>}
 */
const batchedAsyncGeneratorToArray = async (asyncGenerator) => {
	const result = [];
	for await (const batch of asyncGenerator()) {
		result.push(...batch);
	}
	return result;
};

/**
 *
 * @param {string} query
 * @returns {string}
 */
const cleanQuery = (query) => {
	let cleanedString = query.trim();
	if (cleanedString.endsWith(';'))
		cleanedString = cleanedString.substring(0, cleanedString.length - 1);
	// query might end with a line comment, which has to be ended
	return cleanedString + '\n';
};

/**
 * @param {QueryResult} stream
 * @returns {Promise<void>}
 */
const exhaustStream = async ({ rows }) => {
	try {
		for await (const _ of rows()) {
			// exhaust the stream
		}
	} catch {}
};

exports.EvidenceType = EvidenceType;
exports.TypeFidelity = TypeFidelity;
exports.processQueryResults = processQueryResults;
exports.inferColumnTypes = inferColumnTypes;
exports.asyncIterableToBatchedAsyncGenerator = asyncIterableToBatchedAsyncGenerator;
exports.batchedAsyncGeneratorToArray = batchedAsyncGeneratorToArray;
exports.cleanQuery = cleanQuery;
exports.exhaustStream = exhaustStream;

exports.getEnv = require('./src/getEnv.cjs').getEnv;
