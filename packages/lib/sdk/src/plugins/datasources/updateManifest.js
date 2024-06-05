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
 */
export const updateManifest = async (updatedManifest, dataDir) => {
	await fs.mkdir(path.join(dataDir), { recursive: true });

	const existingManifest = await safeLoadManifest(dataDir);

	const finalManifest = merge({}, existingManifest); // deep clone

	if (!updatedManifest.locatedFiles) {
		console.warn(chalk.yellow('[!] No queries were located, operation was a was no-op'));
		return;
	}

	if (existingManifest) {
		for (const schema of Object.keys(updatedManifest.locatedFiles)) {
			if (!(schema in existingManifest.renderedFiles)) {
				continue;
			}
			const locatedQueries = updatedManifest.locatedFiles[schema];
			const newQueries = updatedManifest.renderedFiles[schema].filter((queryPath) => {
				return !existingManifest.renderedFiles[schema].includes(queryPath);
			});
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

			const result = [...existingQueries, ...newQueries].sort((a, b) => a.localeCompare(b));
			finalManifest.renderedFiles[schema] = result;
		}
	} else {
		Object.assign(finalManifest, { renderedFiles: updatedManifest.renderedFiles });
	}

	await fs.writeFile(path.join(dataDir, 'manifest.json'), JSON.stringify(finalManifest));
};
