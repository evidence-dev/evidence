import {
	tableFromArrays,
	tableToIPC,
	vectorFromArray,
	Float64,
	Utf8,
	Bool,
	TimestampMillisecond
} from 'apache-arrow';
import {
	Compression,
	writeParquet,
	WriterPropertiesBuilder,
	Table
} from 'parquet-wasm/node/arrow1.js';
import fs from 'fs/promises';
import path from 'path';
// using node-async.js makes CLI command hang - why??
import { emptyDbFs, initDB, query } from './client-duckdb/node.js';
import chunk from 'lodash.chunk';
import { columnsToScore } from './calculateScore.js';
import chalk from 'chalk';
import { log } from '@evidence-dev/sdk/logger';

/**
 * @param {{name: string, evidenceType: string}} column
 * @param {any[]} rawValues
 * @returns {import("apache-arrow").Vector}
 */
function convertArrayToVector(column, rawValues) {
	switch (column.evidenceType) {
		case 'number':
			return vectorFromArray(rawValues, new Float64());
		case 'string':
			return vectorFromArray(rawValues, new Utf8());
		case 'date':
			if (!rawValues.some((v) => v !== null)) {
				// All null date columns error out, so we have to do this
				// https://github.com/evidence-dev/evidence/issues/2897
				// separate reason than the bool version
				console.warn(
					chalk.yellow(
						`\nWarning: Column "${column.name}" (type Date) contains only null values so it has been cast to Float64`
					)
				);
				return vectorFromArray(rawValues, new Float64());
			}
			// TODO: What gives with timezones
			return vectorFromArray(rawValues, new TimestampMillisecond());
		case 'boolean':
			if (!rawValues.some((v) => v !== null)) {
				// All null bool columns error out, so we have to do this
				// https://github.com/evidence-dev/evidence/issues/1504
				console.warn(
					chalk.yellow(
						`\nWarning: Column "${column.name}" (type Bool) contains only null values so it has been cast to Float64`
					)
				);
				return vectorFromArray(rawValues, new Float64());
			}
			return vectorFromArray(rawValues, new Bool());
		default:
			throw new Error(
				'Unrecognized EvidenceType: ' +
					column.evidenceType +
					'\n This is likely an error in a datasource connector.'
			);
	}
}

/**
 * @template T
 * @param {{name: string, evidenceType: string}[]} columns
 * @param {Generator<T[] | Promise<T[]> | T[] | Promise<T[]>} data
 * @param {string} tmpDir
 * @param {string} outDir
 * @param {string} outputFilename
 * @param {number} [batchSize]
 * @returns {Promise<number>} Number of rows
 */
export async function buildMultipartParquet(
	columns,
	data,
	tmpDir,
	outDir,
	outputFilename,
	batchSize = 1000000
) {
	log.debug(`Building parquet file ${outputFilename}`);
	let { meta: fn_meta, done: fn_done } = log.measure('buildMultipartParquet');
	fn_meta('output filename', outputFilename);

	let batchNum = 0;
	const outputSubpath = outputFilename.split('.parquet')[0];
	let tmpFilenames = [];
	let rowCount = 0;

	// Unique id for this build run to avoid reusing the same temp filenames across
	// consecutive builds in the same session. DuckDB (wasm) may keep handles or
	// mappings to filenames; creating unique filenames per build avoids races or
	// protocol errors when files are replaced.
	const buildId = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

	const flush = async (results) => {
		log.debug(`Flushing batch ${batchNum} with ${results.length} rows`);
		let { meta, done } = log.measure('flush');
		meta('batch number', batchNum);

		// Convert JS Objects -> Arrow
		const vectorized = Object.fromEntries(
			columns.map((c) => [
				c.name,
				convertArrayToVector(
					c,
					results.map((i) => i[c.name] ?? null)
				)
			])
		);
		const table = tableFromArrays(vectorized);
		for (const field of table.schema.fields) {
			field.nullable = true;
		}

		// Converts the arrow table to a buffer
		const IPC = tableToIPC(table, 'stream');

		const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();
		// Converts the arrow buffer to a parquet buffer
		// This can be slow; it includes the compression step

		const parquetBuffer = writeParquet(Table.fromIPCStream(IPC), writerProperties);

	const finalTempFilename = path.join(tmpDir, `${outputSubpath}.${buildId}.${batchNum}.parquet`);
	// Write to a unique temporary file first, then atomically rename into place.
	// This avoids a race where DuckDB may attempt to read a file while it's being written
	// (e.g., during rapid dev refreshes). Using an atomic rename ensures readers only
	// see the completed file.
	const uniqueSuffix = `.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
	const writeTempFilename = finalTempFilename + uniqueSuffix;

	await fs.mkdir(path.dirname(finalTempFilename), { recursive: true });
	await fs.writeFile(writeTempFilename, parquetBuffer);
	// Atomically move into final location
	await fs.rename(writeTempFilename, finalTempFilename);

	tmpFilenames.push(finalTempFilename);
		rowCount += results.length;

		done();
		log.debug(`Flushed batch ${batchNum} with ${results.length} rows`);

		batchNum++;
	};

	if (typeof data === 'function') data = data();
	if (data instanceof Promise) data = await data;
	// Data is an array, but not a nested one
	// We expect a set of result sets;
	if (Array.isArray(data) && !Array.isArray(data[0])) data = [data];
	if (Array.isArray(data)) {
		const arrays = data;
		data = (function* () {
			for (const results of arrays) {
				for (const batch of chunk(results, batchSize)) {
					yield batch;
				}
			}
		})();
	}

	log.debug('Reading rows from a generator object');
	let { meta, done } = log.measure('buildMultipartParquet');
	meta('batch number', batchNum);

	const currentBatch = [];
	for await (const results of data) {
		for (const result of results) currentBatch.push(result);

		if (currentBatch.length >= batchSize) {
			done();
			log.debug(`Flushing batch ${batchNum} with ${currentBatch.length} rows`);
			await flush(currentBatch);
			currentBatch.length = 0;
			({ meta, done } = log.measure('buildMultipartParquet'));
			meta('batch number', batchNum);
		}
	}

	done();
	log.debug(`Flushing batch ${batchNum} with ${currentBatch.length} rows`);

	if (currentBatch.length) await flush(currentBatch);

	if (!tmpFilenames.length) return 0;

	await initDB();

	const outputFilepath = path.join(outDir, outputFilename);

	const parquetFiles = tmpFilenames.map((filename) => `'${filename.replaceAll('\\', '/')}'`);

	const select = `SELECT * FROM read_parquet([${parquetFiles.join(',')}])`;
	const copy = `COPY (${select}) TO '${outputFilepath}' (FORMAT 'PARQUET', CODEC 'ZSTD', USE_TMP_FILE false);`;

	await fs.mkdir(path.dirname(outputFilepath), { recursive: true });
	await query(copy);

	await fs.chmod(outputFilepath, 0o644);

	const { size } = await fs.stat(outputFilepath);
	if (size > 100 * 1024 * 1024) {
		console.warn(
			chalk.yellow(` Estimated disk size is ${Intl.NumberFormat().format(size / (1024 * 1024))}mb.`)
		);
	}

	const score =
		rowCount *
		columnsToScore(
			columns.map(({ name, evidenceType }) => ({
				name,
				type:
					evidenceType === 'number'
						? 'DOUBLE'
						: evidenceType === 'boolean'
							? 'BOOLEAN'
							: evidenceType === 'date'
								? 'TIMESTAMP'
								: 'VARCHAR'
			}))
		);

	if (score > 100 * 1024 * 1024) {
		console.warn(
			chalk.yellow(
				` WARNING: Estimated output size is ${Intl.NumberFormat().format(
					score / (1024 * 1024)
				)}mb uncompressed. This may cause client-side performance issues.`
			)
		);
	}

	for (const tmpFile of tmpFilenames) {
		await fs.rm(tmpFile, { force: true });
	}
	await emptyDbFs('*');

	fn_done();

	return rowCount;
}
