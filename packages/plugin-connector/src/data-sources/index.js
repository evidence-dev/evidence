import {
	getSources,
	getSourcesDir,
	getPastSourceHashes,
	saveSourceHashes,
	getCurrentManifest
} from './get-sources';
import { getDatasourcePlugins } from './get-datasource-plugins';
import { execSource } from './exec-source';
import fs from 'fs/promises';
import path from 'path';

/**
 *
 * @param {Record<string, string[]>} outputFiles
 * @param {string} outDir
 * @param {Awaited<ReturnType<typeof getSources>>} datasources
 */
async function updateManifest(outputFiles, outDir, datasources) {
	const current_manifest = await getCurrentManifest(outDir);

	// delete stale datasources
	for (const source in current_manifest.renderedFiles) {
		if (datasources.find((ds) => ds.name === source)) continue;
		delete current_manifest.renderedFiles[source];
	}

	// delete stale queries
	for (const source of datasources) {
		current_manifest.renderedFiles[source.name] = (
			current_manifest.renderedFiles[source.name] ?? []
		).filter((file) =>
			// this is the same way we name files so it's safe
			source.queries.find((query) => query.name === path.basename(file, '.parquet'))
		);
	}

	// update w/ new queries
	for (const source in outputFiles) {
		current_manifest.renderedFiles[source] = Array.from(
			new Set([...outputFiles[source], ...current_manifest.renderedFiles[source]])
		);
	}

	await fs.mkdir(outDir, { recursive: true });
	await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(current_manifest));
}

/**
 * @param {string} outDir
 * @param {string} [prefix]
 * @param {{ sources: Set<string> | null, queries: Set<string> | null, only_changed: boolean }} [filters] `sources` or `queries` being null means no filter
 */
export async function updateDatasourceOutputs(
	outDir,
	prefix,
	filters = { sources: null, queries: null, only_changed: false }
) {
	const datasourceDir = await getSourcesDir();
	if (!datasourceDir) throw new Error('missing sources directory');
	const datasources = await getSources(datasourceDir);
	const plugins = await getDatasourcePlugins();
	const sourceHashes = await getPastSourceHashes();

	const filteredDatasources = datasources
		.filter((source) => !filters.sources || filters.sources.has(source.name))
		.map((source) => {
			const queries = source.queries.filter((query) => {
				if (
					filters.queries &&
					!filters.queries.has(query.name) &&
					!filters.queries.has(`${source.name}.${query.name}`)
				)
					return false;

				if (!filters.only_changed) return true;
				const query_hash = sourceHashes[source.name]?.[query.name];
				return query_hash !== query.hash;
			});
			return { ...source, queries };
		})
		.filter(
			(source) =>
				source.queries.length > 0 ||
				console.log(`No queries left for source ${source.name} after filtration`)
		);

	for (const source of filteredDatasources) {
		sourceHashes[source.name] = sourceHashes[source.name] ?? {};
		for (const query of source.queries) {
			sourceHashes[source.name][query.name] = query.hash;
		}
	}

	await saveSourceHashes(sourceHashes);

	// TODO: Run in parallel?
	/** @type {Record<string, string[]>} */
	const outputFiles = {};
	for (const source of filteredDatasources) {
		outputFiles[source.name] = [];
		const newFiles = await execSource(source, plugins, outDir);
		if (prefix) {
			outputFiles[source.name].push(...newFiles.map((nf) => `${prefix}${nf}`));
		} else {
			outputFiles[source.name].push(...newFiles);
		}
	}

	await updateManifest(outputFiles, outDir, datasources);
}
