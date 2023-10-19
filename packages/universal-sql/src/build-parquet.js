import {
	tableFromArrays,
	tableToIPC,
	vectorFromArray,
	Float64,
	Utf8,
	Bool,
	TimestampMillisecond
} from 'apache-arrow';
import { Compression, writeParquet, WriterPropertiesBuilder } from 'parquet-wasm/node/arrow1.js';
import fs from 'fs/promises';
import path from 'path';
// using node-async.js makes CLI command hang - why??
import { initDB, query } from './client-duckdb/node.js';
import { isGeneratorObject } from 'util/types';
import chunk from 'lodash.chunk';
import { columnsToScore } from './calculateScore.js';
import chalk from 'chalk';

/**
 * @param {string} type
 * @param {any[]} rawValues
 * @returns {import("apache-arrow").Vector}
 */
function convertArrayToVector(type, rawValues) {
	switch (type) {
		case 'number':
			return vectorFromArray(rawValues, new Float64());
		case 'string':
			return vectorFromArray(rawValues, new Utf8());
		case 'date':
			// TODO: What gives with timezones
			return vectorFromArray(rawValues, new TimestampMillisecond());
		case 'boolean':
			return vectorFromArray(rawValues, new Bool());
		default:
			throw new Error(
				'Unrecognized EvidenceType: ' +
					type +
					'\n This is likely an error in a datasource connector.'
			);
	}
}

/**
 * @template T
 * @param {{name: string, evidenceType: string}[]} columns
 * @param {Generator<T[] | Promise<T[]> | T[] | Promise<T[]>} data
 * @param {string} outputFilename
 * @param {number} [batchSize]
 * @returns {Promise<number>} Number of rows
 */
export async function buildMultipartParquet(columns, data, outputFilename, batchSize = 1000000) {
	let batchNum = 0;
	const outputPrefix = outputFilename.split('.parquet')[0];
	let tmpFilenames = [];
	let rowCount = 0;

	const flush = async (results) => {
		// Convert JS Objects -> Arrow
		const vectorized = Object.fromEntries(
			columns.map((c) => [
				c.name,
				convertArrayToVector(
					c.evidenceType,
					results.map((i) => i[c.name])
				)
			])
		);
		const table = tableFromArrays(vectorized);

		// Converts the arrow table to a buffer
		const IPC = tableToIPC(table, 'stream');

		const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();
		// Converts the arrow buffer to a parquet buffer
		// This can be slow; it includes the compression step
		console.debug(` || Compressing batch ${batchNum}`);
		const parquetBuffer = writeParquet(IPC, writerProperties);

		console.debug(` || Writing batch ${batchNum} with ${results.length} rows.`);
		const tempFilename = path.join(
			'.',
			'.evidence',
			'template',
			'.evidence-queries',
			'intermediate-parquet',
			outputPrefix + `.${batchNum}.parquet`
		);
		await fs.mkdir(path.dirname(tempFilename), { recursive: true });
		await fs.writeFile(tempFilename, parquetBuffer);

		console.debug(` || Batch ${batchNum} written.`);
		tmpFilenames.push(tempFilename);
		rowCount += results.length;
		batchNum++;
	};

	if (typeof data === 'function') data = data();
	if (data instanceof Promise) data = await data;
	// Data is an array, but not a nested one
	// We expect a set of result sets;
	if (Array.isArray(data) && !Array.isArray(data[0])) data = [data];

	// Handle generators
	if (isGeneratorObject(data)) {
		let currentBatch = [];
		for await (const results of data) {
			currentBatch = currentBatch.concat(results);

			if (currentBatch.length >= batchSize) {
				await flush(currentBatch);
				currentBatch = [];
			}
		}
		if (currentBatch.length) await flush(currentBatch);
	} else {
		let currentBatch = [];
		for (const results of data) {
			// If the array is longer than the batch size; it gets chunked
			for (const batch of chunk(results, batchSize)) {
				// Iterate through the split up chunks
				// Batch them and flush when needed

				currentBatch = currentBatch.concat(batch);

				if (currentBatch.length >= batchSize) {
					// Time to flush
					await flush(currentBatch);
					currentBatch = [];
				}
			}
		}
		// Ensure nothing is left over
		if (currentBatch.length) await flush(currentBatch);
	}

	if (!tmpFilenames.length) return 0;

	await initDB();

	const parquetFiles = tmpFilenames
		.map((filename) => `'${filename.replaceAll('\\', '/')}'`)
		.join(',');
	const select = `SELECT * FROM read_parquet([${parquetFiles}])`;
	const copy = `COPY (${select}) TO '${path.join(
		'.',
		'static',
		'data',
		outputFilename
	)}' (FORMAT 'PARQUET', CODEC 'ZSTD');`;

	await query(copy);

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
				` || WARNING: ${outputFilename} is estimated to be ${Intl.NumberFormat().format(
					score / (1024 * 1024)
				)}mb. This may cause client-side performance issues.`
			)
		);
	}

	for (const tmpFile of tmpFilenames) {
		await fs.rm(tmpFile);
	}
	return rowCount;
}
