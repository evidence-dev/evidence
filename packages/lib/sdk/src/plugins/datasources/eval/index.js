import chalk from 'chalk';
import { evalSource } from './evalSource.js';
import { loadDependencies } from './loadDependencies.js';
import { flushCache } from '../SourceResultCache.js';

/** @typedef {import('../types.js').Manifest} Manifest */
/** @typedef {import('../types.js').SourceFilters} SourceFilters */

/**
 * @param {string} dataPath
 * @param {string} metaPath
 * @param {SourceFilters} [filters] `sources` or `queries` being null means no filter
 * @param {boolean} [strict]
 * @returns {Promise<Manifest>}
 */
export const evalSources = async (dataPath, metaPath, filters, strict) => {
	const { sourcePlugins, sources } = await loadDependencies(metaPath);

	/** @type {Manifest} */
	const outputManifest = {
		renderedFiles: {},
		locatedFiles: {},
		locatedSchemas: []
	};
	/** @type {string[]} */
	const skippedSources = [];

	for (const source of sources) {
		outputManifest.locatedSchemas ??= [];
		outputManifest.locatedFiles ??= {};
		outputManifest.locatedSchemas.push(source.name);

		if (filters?.sources?.size && !filters?.sources?.has(source.name)) {
			console.debug(`  [Skipping]: ${chalk.bold(source.name)}`);
			skippedSources.push(source.name);
			continue;
		}

		const sourceOutput = await evalSource(
			source,
			sourcePlugins.getBySource(source.type),
			{
				dataPath,
				metaPath
			},
			filters,
			strict
		);

		outputManifest.locatedFiles[source.name] = sourceOutput.located;
		outputManifest.renderedFiles[source.name] = sourceOutput.rendered;
	}

	await flushCache(metaPath);
	return outputManifest;
};
