import fs from 'fs/promises';
import path from 'path';
import { ManifestSchema } from './schemas/manifest.schema.js';
import merge from 'lodash.merge';
import chalk from 'chalk';

/**
 *
 * @param {string} dataDir
 * @returns
 */
const safeLoadManifest = async (dataDir) => {
	const manifestPath = path.join(dataDir, 'manifest.json');
	const dirContent = await fs.readdir(dataDir);
	if (!dirContent.includes('manifest.json')) return null;
	if (!(await fs.stat(manifestPath)).isFile()) return null;
	const m = await fs.readFile(manifestPath, 'utf-8');
	try {
		const parsed = JSON.parse(m);
		const valid = ManifestSchema.parse(parsed);
		return valid;
	} catch {
		return null;
	}
};

/**
 * @param {import('./types.js').Manifest} updatedManifest
 * @param {string} dataDir
 * @returns {Promise<import('./types.js').Manifest>}
 */
export const updateManifest = async (updatedManifest, dataDir) => {
	await fs.mkdir(path.join(dataDir), { recursive: true });

	const existingManifest = await safeLoadManifest(dataDir);

	const finalManifest = merge({}, existingManifest); // deep clone

	if (!updatedManifest.locatedFiles) {
		console.warn(chalk.yellow('[!] No queries were located, operation was a was no-op'));
		return updatedManifest;
	}
	if (!updatedManifest.locatedSchemas) {
		console.warn(chalk.yellow('[!] No sources were located, operation was a was no-op'));
		return updatedManifest;
	}

	if (existingManifest) {
		for (const schema of updatedManifest.locatedSchemas) {
			console.debug("  Updating schema '" + schema + "'");
			if (!(schema in existingManifest.renderedFiles)) {
				console.debug('  | Schema is new');
				console.debug(
					`  |   ${updatedManifest.renderedFiles[schema].length} ${updatedManifest.renderedFiles[schema].length === 1 ? 'query' : 'queries'} will be added`
				);
				finalManifest.renderedFiles[schema] = updatedManifest.renderedFiles[schema];
				continue;
			} else {
				console.debug('  | Schema exists already');
			}
			const locatedQueries = updatedManifest.locatedFiles[schema];
			if (!locatedQueries?.length) {
				console.debug('  | No queries were located, but schema exists already');
				console.debug('  |   Previous files will be kept');
				continue;
			}
			console.debug(
				`  | ${locatedQueries.length} ${locatedQueries.length === 1 ? 'query' : 'queries'} found`
			);
			locatedQueries.forEach((q) => console.debug('  |   ' + q));
			const newQueries = updatedManifest.renderedFiles[schema].filter((queryPath) => {
				return !existingManifest.renderedFiles[schema].includes(queryPath);
			});
			console.debug(
				`  | ${newQueries.length} ${newQueries.length === 1 ? 'query' : 'queries'} are new`
			);
			newQueries.forEach((q) => console.debug('  |   ' + q));
			const existingQueries = existingManifest.renderedFiles[schema]
				.filter((queryPath) => {
					return locatedQueries.includes(path.basename(queryPath, '.parquet'));
				})
				.filter(
					// we want to prefer the new query path
					// file basenames should never conflict, so we can safely use that as a ref
					(queryPath) =>
						!newQueries.some(
							(newQueryPath) =>
								path.basename(newQueryPath, '.parquet') === path.basename(queryPath, '.parquet')
						)
				);
			console.debug(
				`  | ${existingQueries.length} ${existingQueries.length === 1 ? 'query' : 'queries'} already ${existingQueries.length ? 'exists' : 'exist'}`
			);
			existingQueries.forEach((q) => console.debug('  |   ' + q));

			const result = [...existingQueries, ...newQueries].sort((a, b) => a.localeCompare(b));
			console.debug(
				`  | ${result.length} ${result.length === 1 ? 'query' : 'queries'} to be rendered`
			);
			result.forEach((q) => console.debug('  |   ' + q));
			finalManifest.renderedFiles[schema] = result;
		}
		for (const schema of Object.keys(existingManifest.renderedFiles)) {
			if (!updatedManifest.locatedSchemas.includes(schema)) {
				console.debug("  Removing schema '" + schema + "'");
				delete finalManifest.renderedFiles[schema];
			}
		}
	} else {
		Object.assign(finalManifest, { renderedFiles: updatedManifest.renderedFiles });
	}

	await fs.writeFile(path.join(dataDir, 'manifest.json'), JSON.stringify(finalManifest));
	return finalManifest;
};
