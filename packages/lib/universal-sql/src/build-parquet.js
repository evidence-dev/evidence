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
import { isGeneratorObject } from 'util/types';
import chunk from 'lodash.chunk';
import { columnsToScore } from './calculateScore.js';
import chalk from 'chalk';
import { jsToIPC } from './jsToIPC.js';

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
	let batchNum = 0;
	const outputSubpath = outputFilename.split('.parquet')[0];
	let tmpFilenames = [];
	let rowCount = 0;

	const flush = async (results) => {
		const IPC = jsToIPC(results, columns);

		const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();
		// Converts the arrow buffer to a parquet buffer
		// This can be slow; it includes the compression step

		const parquetBuffer = writeParquet(Table.fromIPCStream(IPC), writerProperties);

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
			for (const result of results) currentBatch.push(result);

			if (currentBatch.length >= batchSize) {
				await flush(currentBatch);
				currentBatch.length = 0;
			}
		}
		if (currentBatch.length) await flush(currentBatch);
	} else {
		for (const results of data) {
			// If the array is longer than the batch size; it gets chunked
			for (const batch of chunk(results, batchSize)) {
				await flush(batch);
			}
		}
	}

	if (!tmpFilenames.length) return 0;

	await initDB();

	const outputFilepath = path.join(outDir, outputFilename);
	await fs.mkdir(path.dirname(outputFilepath), { recursive: true });

	const parquetFiles = tmpFilenames.map((filename) => `'${filename.replaceAll('\\', '/')}'`);

	const select = `SELECT * FROM read_parquet([${parquetFiles.join(',')}])`;
	const copy = `COPY (${select}) TO '${outputFilepath}' (FORMAT 'PARQUET', CODEC 'ZSTD');`;

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
	return rowCount;
}
