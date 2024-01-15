const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const stream = require('stream');
const {
	inferColumnTypes,
	getEnv,
	asyncIterableToBatchedAsyncGenerator,
	cleanQuery,
	exhaustStream
} = require('@evidence-dev/db-commons');

// https://gist.github.com/rmela/a3bed669ad6194fb2d9670789541b0c7
class DBStream extends stream.Readable {
	constructor() {
		super({ objectMode: true });
	}

	static async create({ opts, sql }) {
		const db = await open(opts);
		const dbstream = new DBStream();
		dbstream.stmt = await db.prepare(sql);
		dbstream.on('end', () => dbstream.stmt.finalize(() => db.close()));
		return dbstream;
	}

	_read() {
		let strm = this;
		this.stmt
			.get()
			.then((result) => strm.push(result ?? null))
			.catch((err) => strm.emit('error', err));
	}
}

const envMap = {
	filename: [
		{ key: 'EVIDENCE_SQLITE_FILENAME', deprecated: false },
		{ key: 'SQLITE_FILENAME', deprecated: false },
		{ key: 'FILENAME', deprecated: true },
		{ key: 'filename', deprecated: true }
	]
};

/** @type {import('@evidence-dev/db-commons').RunQuery<SQLiteOptions>} */
const runQuery = async (queryString, database, batchSize = 100000) => {
	const filename = database ? database.filename : getEnv(envMap, 'filename');
	try {
		const opts = {
			filename: filename,
			driver: sqlite3.Database,
			mode: sqlite3.OPEN_READONLY
		};

		const db = await open(opts);
		const cleaned_query = cleanQuery(queryString);
		const count_results = await db.all(`WITH root as (${cleaned_query}) SELECT COUNT(*) FROM root`);
		const expected_row_count = count_results[0]['COUNT(*)'];

		const stream = await DBStream.create({ opts, sql: queryString });

		const results = await asyncIterableToBatchedAsyncGenerator(stream, batchSize, {
			mapResultsToEvidenceColumnTypes: inferColumnTypes
		});
		results.expectedRowCount = expected_row_count;

		return results;
	} catch (err) {
		if (err.message) {
			if (err.errno === 14) {
				throw 'Unable to open ' + filename + ' in ' + path.resolve('../../');
			} else {
				throw err.message;
			}
		} else {
			throw err;
		}
	}
};

module.exports = runQuery;

/**
 * @typedef {Object} SQLiteOptions
 * @property {string} filename
 */

/** @type {import('@evidence-dev/db-commons').GetRunner<SQLiteOptions>} */
module.exports.getRunner = async (opts, directory) => {
	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(
			queryContent,
			{ ...opts, filename: path.join(directory, opts.filename) },
			batchSize
		);
	};
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<DuckDBOptions>} */
module.exports.testConnection = async (opts, directory) => {
	const r = await runQuery('SELECT 1;', { ...opts, filename: path.join(directory, opts.filename) })
		.then(exhaustStream)
		.then(() => true)
		.catch((e) => ({ reason: e.message ?? 'File not found' }));
	return r;
};

module.exports.options = {
	filename: {
		title: 'Filename',
		type: 'string',
		secret: false,
		description:
			'SQLite filename. This is relative to your source directory, not your project directory.',
		default: 'needful_things.sqlite',
		required: true
	}
};
