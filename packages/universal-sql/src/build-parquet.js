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
import { emptyDbFs, initDB, query, setParquetURLs } from './client-duckdb/node.js';
import chunk from 'lodash.chunk';
import chalk from 'chalk';

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
 * @param {string} queryName
 * @param {number} parquetRows
 * @param {string[]} [partitionKeys]
 * @returns {Promise<{writtenRows: number, filenames: string[]}>}
 */
export async function buildMultipartParquet(
	columns,
	data,
	tmpDir,
	outDir,
	queryName,
	parquetRows,
	partitionKeys = []
) {
	let parquetIdx = 0;
	const tempFiles = [];
	let writtenRows = 0;
	
	/**
	 * @param {Record<string,unknown>[]} resultSet
	 */
	const writeTmpParquetFile = async (resultSet) => {
		// Convert JS Objects -> Arrow
		const vectorized = Object.fromEntries(
			columns.map((c) => [
				c.name,
				convertArrayToVector(
					c,
					resultSet.map((i) => i[c.name] ?? null)
				)
			])
		);
		const table = tableFromArrays(vectorized);
		for (const field of table.schema.fields) {
			field.nullable = true;
		}

		// Converts the arrow table to a buffer
		const IPC = tableToIPC(table, 'stream');

		// If we have partitionKeys, these files are not final, if we do not, then these files are final
		const compression = partitionKeys.length ? Compression.UNCOMPRESSED : Compression.GZIP

		const writerProperties = new WriterPropertiesBuilder().setCompression(compression).build();
		// Converts the arrow buffer to a parquet buffer
		// This can be slow; it includes the compression step

		const parquetBuffer = writeParquet(Table.fromIPCStream(IPC), writerProperties);

		const filename = path.join(tmpDir, `${queryName}.${parquetIdx}.parquet`);
		await fs.mkdir(path.dirname(filename), { recursive: true });
		await fs.writeFile(filename, parquetBuffer);

		tempFiles.push(filename);
		writtenRows += resultSet.length;
		parquetIdx++;
	}

	// Unwrap data into a guarunteed iterator
	if (typeof data === 'function') data = data();
	if (data instanceof Promise) data = await data;
	if (Array.isArray(data) && !Array.isArray(data[0])) data = [data]; // data is a single row
	
	let currentBatch = []
	for await (const result of data) {
		currentBatch = currentBatch.concat(result)
		if (currentBatch.length >= parquetRows) { // we have at least one parquet amount

			for (const c of chunk(currentBatch, parquetRows)) {
				await writeTmpParquetFile(c)
			}
			currentBatch = []
		}
	}
	// Write any remaining rows
	if (currentBatch.length) {
		for (const c of chunk(currentBatch, parquetRows)) {
			await writeTmpParquetFile(c)
		}
	}

	if (!tempFiles.length) return { writtenRows: 0, filenames: [] }; // wrote no files

	const outputFilepath = path.join(outDir, queryName)

	// clean and rebuild the output directory
	await fs.rm(path.dirname(outputFilepath), { recursive: true, force: true });
	await fs.mkdir(path.dirname(outputFilepath), { recursive: true });
	
	const parquetFiles = tempFiles.map((filename) => `${filename.replaceAll('\\', '/')}`);

	if (partitionKeys.length) {
		await initDB();
		const chunked = chunk(
			tempFiles,
			5
		)

		let i = 0
		for(const c of chunked) {
			// we have hive partitioning, go ahead and transform filenames
			const ddbTmpDir = path.join(tmpDir, 'ddb')
					
			const partitionString = partitionKeys?.length
				? `, PARTITION_BY (${partitionKeys.join(', ')}), OVERWRITE_OR_IGNORE 1`
				: '';
			const copy = `COPY (SELECT * FROM read_parquet([${c.map(f => `'${f}'`).join(',')}])) TO '${path.resolve(outDir, i.toString())}' (FORMAT 'PARQUET', CODEC 'ZSTD' ${partitionString});`;
			const tmpDirPragma = `PRAGMA temp_directory='./${ddbTmpDir}'`
			i++;
			await fs.mkdir(ddbTmpDir, { recursive: true })

			await query(tmpDirPragma);
			await query(copy);
		}
	} else {
		// no hive partitioning, just copy over the files
		for (const tmp of parquetFiles) {
			const tmpName = path.parse(tmp).base
			await fs.rename(path.resolve(tmp), path.join(outDir, tmpName))
		}
	}

	if (!process.env.VITE_EVIDENCE_DEBUG) await fs.rm(tmpDir, { force: true, recursive: true });

	const allfiles = await fs.readdir(outDir, { withFileTypes: true, recursive: true });
	const parquets = allfiles
		.filter((f) => f.name.endsWith('.parquet') && f.isFile())
		.map((f) => path.join(f.path, f.name));
	
	if (process.env.VITE_EVIDENCE_DEBUG) console.log({ parquets, outDir, resolved: parquets.map(p => path.resolve(p)) });
	return { writtenRows, filenames: parquets };
}
