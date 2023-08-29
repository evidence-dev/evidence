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
// This import is a little weird because of the exports field in package.json
// relative addressing (e.g. ./client-duckdb/node.js) doesn't work
import { initDB, query } from '@evidence-dev/universal-sql/client-duckdb';
import { isGeneratorObject } from 'util/types';
import chunk from "lodash.chunk"

/**
 *
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
 * @returns {Promise<number>} Number of rows written
 */
export async function buildMultipartParquet(columns, data, outputFilename, batchSize = 100 * 1) {
	let currentBatch = [];
	let batchNum = 0;
	const outputPrefix = outputFilename.split('.parquet')[0];
	let tmpFilenames = [];
	let rowCount = 0;

	const flush = async () => {
		const vectorized = Object.fromEntries(
			columns.map((c) => [
				c.name,
				convertArrayToVector(
					c.evidenceType,
					currentBatch.map((i) => i[c.name])
				)
			])
		);
		const table = tableFromArrays(vectorized);
		const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();

		const IPC = tableToIPC(table, 'stream');

		const tempFilename = path.join('.', 'sources', outputPrefix + `.${batchNum++}.parquet`);
		await fs.writeFile(tempFilename, writeParquet(IPC, writerProperties));
		tmpFilenames.push(tempFilename);
		rowCount += currentBatch.length;
		currentBatch = [];
	};

	if (typeof data === 'function') data = data();
	if (data instanceof Promise) data = await data;
	// Data is an array, but not a nested one
	// Wrap it in an array for the sake of simplicity
	if (Array.isArray(data) && !Array.isArray(data[0])) data = [data];

	// Handle generators
	// We use this method to ensure that the `return` value is not ignored
	if (isGeneratorObject(data)) {
		let i;
		while ((i = await data.next())) {
			if (i.value) currentBatch.push(...i.value);
			if (currentBatch.length >= batchSize) await flush();
			if (i.done) break;
		}
	} else {
		for await (const _results of data) {
			const results = await _results;
			currentBatch.push(...results);
			if (currentBatch.length >= batchSize) {
				// Time to flush
				await flush();
			}
		}
	}

	// Flush final, incomplete batch
	if (currentBatch.length) await flush();

	if (!tmpFilenames.length) return 0;
	
	await initDB();

	while (tmpFilenames.length > 10) {
		let intermediateFilenames = chunk(tmpFilenames, 10)
		let newTmpFilenames = []

		for (const files of intermediateFilenames) {
			const selectFiles = files.map(f => `SELECT * FROM '${f}'`).join("\nUNION\n")
			const intermediateFilename = path.join('.', 'sources', outputPrefix + `.intermediate.${batchNum++}.parquet`);
			const copyToNewTemp = `COPY (${selectFiles}) TO '${intermediateFilename}' (FORMAT 'PARQUET', CODEC 'ZSTD')`
			await query(copyToNewTemp);
			newTmpFilenames.push(intermediateFilename)
			for (const file of files) {
				await fs.rm(file)
			}
		}

		tmpFilenames = newTmpFilenames
	}

	

	
	
	const select = tmpFilenames.map((filename) => `SELECT * FROM '${filename}'`).join('\nUNION\n');
	const copy = `COPY (${select}) TO '${path.join(
		'.',
		'static',
		'data',
		outputFilename
	)}' (FORMAT 'PARQUET', CODEC 'ZSTD');`;
	
	await query(copy);

	for (const tmpFile of tmpFilenames) {
		await fs.rm(tmpFile);
	}
	return rowCount;
}

/**
 * Constructs a Buffer from provided table metadata
 * @param {{name: string, evidenceType: string}[]} columns
 * @param {any[]} data
 * @returns {Promise<Uint8Array>}
 */
export async function buildParquetFromResultSet(columns, data) {
	const m = columns.map((c) => {
		const rawValues = data.map((d) => d[c.name] ?? `Null`);

		return [c.name, convertArrayToVector(c.evidenceType, rawValues)];
	});

	const t = tableFromArrays(Object.fromEntries(m));

	const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();

	const IPC = tableToIPC(t, 'stream');

	return writeParquet(IPC, writerProperties);
}
