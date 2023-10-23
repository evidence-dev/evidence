import chalk from 'chalk';
import { buildMultipartParquet } from '@evidence-dev/universal-sql';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import { z } from 'zod';

/**
 * @param {DatasourceSpec} source
 * @param {PluginDatabases} supportedDbs
 * @param {string} outDir
 * @returns {Promise<string[]>} Returns a list of generated parquet files
 */
export const execSource = async (source, supportedDbs, outDir) => {
	if (!(source.type in supportedDbs)) {
		const errMsg = chalk.red(
			`[!] ${chalk.bold(`"${source.type}"`)} does not have an adapter installed, ${
				source.name
			} will only contain empty results.`
		);
		throw new Error(errMsg);
	}

	// TODO: What is a good way to determine this?
	// A 1m row table from the faker datasource may be smaller than the 250k row from postgres, because it is wider.
	// Can we somehow guess based on the number of columns?
	// e.g. 1-10 columns -> 1m, 11+ -> 100k?

	const batchSize = 1000 * 1000; // 1m
	const db = supportedDbs[source.type];
	const runner = await db.factory(source.options, source.sourceDirectory);

	console.log(`Executing ${source.name}`);
	/** @type {Set<string>} */
	const outputFilenames = new Set();

	const sourceBefore = performance.now();
	for (const query of source.queries) {
		const filename = query.filepath.split(path.sep).pop();
		console.log(` >| Executing ${filename}`);
		const beforeQuery = performance.now();

		let result;
		try {
			const _r = runner(query.content, query.filepath, batchSize);
			if (_r instanceof Promise) {
				result = await _r.catch((e) => {
					if (e instanceof z.ZodError) console.log(e.format());
					else console.log(e);
					return null;
				});
			} else result = _r;
		} catch (e) {
			if (e instanceof z.ZodError)
				console.log(/**@type {Error & { format: () => any}}*/ (e).format());
			else console.log(e);
			result = null;
		}

		console.log(
			` || Executed ${filename} (took ${(performance.now() - beforeQuery).toFixed(2)}ms)`
		);
		if (!result) {
			console.log(
				` <| Finished ${filename}. Returned no results! (took ${(
					performance.now() - beforeQuery
				).toFixed(2)}ms)\n`
			);
			continue;
		}

		const queryDirectory = path.dirname(query.filepath);
		const sourcesPath = path.dirname(source.sourceDirectory);
		const querySubdir = path.join(queryDirectory.replace(sourcesPath, ''), query.name);

		// remove potentially old files
		await fs.rm(path.join(outDir, querySubdir), { recursive: true }).catch(() => {});

		const outputSubdir = queryDirectory.replace(sourcesPath, '');

		const outputFilename = new URL(
			`file:///${path.join(outputSubdir, query.name + '.parquet').slice(1)}`
		).pathname;
		console.log(` || Writing ${filename} results to disk`);
		const beforeFile = performance.now();
		await fs.mkdir(path.join(outDir, outputSubdir), { recursive: true });

		const rows = /** @type {any[] | Generator<any[]>} */ (result.rows);

		if (result.expectedRowCount) {
			if (result.expectedRowCount > 1000000)
				console.warn(
					` || ${filename} is expected to return ~${result.expectedRowCount?.toLocaleString()} rows. This may take some time!`
				);
			else
				console.log(
					` || ${filename} is expected to return ~${result.expectedRowCount?.toLocaleString()} rows.`
				);
		}

		const writtenRows = await buildMultipartParquet(
			result.columnTypes,
			rows,
			outputFilename,
			batchSize
		);
		if (!writtenRows) {
			console.log(
				` <| Finished ${filename}. No rows returned, did not create parquet file (took ${(
					performance.now() - beforeQuery
				).toFixed(2)}ms)\n`
			);
			continue;
		}
		outputFilenames.add(outputFilename);
		await fs.writeFile(
			path.join(outDir, outputSubdir, query.name + '.schema.json'),
			JSON.stringify(result.columnTypes)
		);
		console.log(
			` || Wrote ${filename} results (took ${(performance.now() - beforeFile).toFixed(2)}ms)`
		);

		console.log(
			` <| Finished ${filename} Returned ${writtenRows} rows. (took ${(
				performance.now() - beforeQuery
			).toFixed(2)}ms)\n`
		);
	}

	console.log(`Finished ${source.name} (took ${(performance.now() - sourceBefore).toFixed(2)}ms)`);

	return Array.from(outputFilenames);
};
