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
import { emptyDbFs, initDB, query } from './client-duckdb/node.js';
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
 * @param {string} tmpDir
 * @param {string} outDir
 * @param {string} outputFilename
 * @param {number} [expectedRowCount]
 * @param {number} [batchSize]
 * @returns {Promise<number>} Number of rows
 */
export async function buildMultipartParquet(
	columns,
	data,
	tmpDir,
	outDir,
	outputFilename,
	expectedRowCount,
	batchSize = 1000000
) {
	let batchNum = 0;
	const outputSubpath = outputFilename.split('.parquet')[0];
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

		const parquetBuffer = writeParquet(IPC, writerProperties);

		const tempFilename = path.join(tmpDir, `${outputSubpath}.${batchNum}.parquet`);
		await fs.mkdir(path.dirname(tempFilename), { recursive: true });
		await fs.writeFile(tempFilename, parquetBuffer);

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

	const outputFilepath = path.join(outDir, outputFilename);
	await fs.mkdir(path.dirname(outputFilepath), { recursive: true });

	const parquetFiles = tmpFilenames.map((filename) => `'${filename.replaceAll('\\', '/')}'`);

	const select = `SELECT * FROM read_parquet([${parquetFiles.join(',')}])`;
	const copy = `COPY (${select}) TO '${outputFilepath}' (FORMAT 'PARQUET', CODEC 'ZSTD');`;

	await emptyDbFs(outputFilepath);
	await query(copy);

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

	return rowCount;
}
