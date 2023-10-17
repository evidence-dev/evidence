const { getEnv } = require('@evidence-dev/db-commons');
const { Database, OPEN_READONLY, OPEN_READWRITE } = require('duckdb-async');

const envMap = {
	filename: [
		{ key: 'EVIDENCE_DUCKDB_FILENAME', deprecated: false },
		{ key: 'DUCKDB_FILENAME', deprecated: false },
		{ key: 'filename', deprecated: true },
		{ key: 'FILENAME', deprecated: true }
	]
};

function nativeTypeToEvidenceType(data) {
	switch (typeof data) {
		case 'number':
			return 'number';
		case 'bigint':
			return 'number';
		case 'string':
			return 'string';
		case 'boolean':
			return 'boolean';
		case 'object':
			if (data instanceof Date) {
				return 'date';
			}
			return undefined;
		default:
			return 'string';
	}
}

const mapResultsToEvidenceColumnTypes = function (rows) {
	return Object.entries(rows[0]).map(([name, value]) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(value);
		if (!evidenceType) {
			typeFidelity = 'inferred';
			evidenceType = 'string';
		}
		return { name, evidenceType, typeFidelity };
	});
};

const runQuery = async (queryString, database) => {
	const filename = database ? database.filename : getEnv(envMap, 'filename');
	var filepath;
	if (filename.includes('.db') || filename.includes('.duckdb')) {
		filepath = '../../' + filename;
	} else {
		filepath = filename;
	}
	const mode = filename !== ':memory:' ? OPEN_READONLY : OPEN_READWRITE;

	try {
		const db = await Database.create(filepath, mode);
		const rows = await db.all(queryString);
		return { rows, columnTypes: mapResultsToEvidenceColumnTypes(rows) };
	} catch (err) {
		if (err.message) {
			throw err.message;
		} else {
			throw err;
		}
	}
};

module.exports = runQuery;
