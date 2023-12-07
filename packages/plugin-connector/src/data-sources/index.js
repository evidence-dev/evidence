import { getSources, getSourcesDir, getCurrentManifest } from './get-sources';
// import { getDatasourcePlugins } from './get-datasource-plugins';
// import { execSource } from './exec-source';
import fs from 'fs/promises';
import path from 'path';
import { buildSources } from './build-sources';

export { getDatasourcePlugins } from './get-datasource-plugins';
export { updateDatasourceOptions } from './update-datasource-options';
export { DatasourceSpecFileSchema, DatasourceSpecSchema } from './schemas/datasource-spec.schema';
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
	// TODO: Bring this back
	// for (const source of datasources) {
	// 	current_manifest.renderedFiles[source.name] = (
	// 		current_manifest.renderedFiles[source.name] ?? []
	// 	).filter((file) =>
	// 		// this is the same way we name files so it's safe
	// 		source.queries.find((query) => query.name === path.basename(file, '.parquet'))
	// 	);
	// }

	for (const source in outputFiles) {
		// remove queries that have been replaced
		const new_queries = new Set(outputFiles[source].map((file) => path.basename(file, '.parquet')));
		current_manifest.renderedFiles[source] = current_manifest.renderedFiles[source]?.filter(
			(/** @type {string} */ file) => !new_queries.has(path.basename(file, '.parquet'))
		);

		// update w/ new queries
		current_manifest.renderedFiles[source] = Array.from(
			new Set([...outputFiles[source], ...(current_manifest.renderedFiles[source] ?? [])])
		);
	}

	await fs.mkdir(outDir, { recursive: true });
	await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(current_manifest));
}

/**
 * @param {string} sourceName - The name of the source.
 * @param {object} sourceConfig - The configuration options for the source.
 * @returns {Record<string,string>} - An object containing environment variables for the source.
 */
const generateSourceEnvironmentVariables = (sourceName, sourceConfig) => {
	/** @type {Record<string,string>} */
	const sourceEnvVars = {};

	// Recursively generate environment variables for nested properties
	/**
	 * @param {any} obj
	 */
	const generateNestedEnvVars = (obj, currentKey = '') => {
		for (const [key, value] of Object.entries(obj)) {
			const newKey = currentKey ? `${currentKey}__${key}` : key;

			if (typeof value === 'object') {
				generateNestedEnvVars(value, newKey);
			} else {
				sourceEnvVars[`EVIDENCE_SOURCE__${sourceName}__${newKey}`] = value.toString();
			}
		}
	};

	// Start generating environment variables for the source
	generateNestedEnvVars(sourceConfig);

	return sourceEnvVars;
};

/**
 * Helper function to load configured datasources
 * @param {string} [datasourceDir]
 * @returns {Promise<(DatasourceSpec & { environmentVariables: object })[]>}
 */
export async function getDatasourceOptions(datasourceDir) {
	datasourceDir = datasourceDir ?? (await getSourcesDir()) ?? undefined;
	if (!datasourceDir) throw new Error('missing sources directory');
	const sources = await getSources(datasourceDir);

	return sources.map((s) => ({
		...s,
		environmentVariables: generateSourceEnvironmentVariables(s.name, s.options)
	}));
}

/**
 * @param {string} dataPath
 * @param {string} metaPath
 * @param {{ sources: Set<string> | null, queries: Set<string> | null, only_changed: boolean }} [filters] `sources` or `queries` being null means no filter
 * @returns {Promise<Record<string, string[]>>}
 */
export async function updateDatasourceOutputs(
	dataPath,
	metaPath,
	filters = { sources: null, queries: null, only_changed: false }
) {
	const sourceDir = await getSourcesDir(true);
	if (!sourceDir) throw new Error();
	const sources = await getSources(sourceDir);
	const manifest = await buildSources(sources, dataPath, metaPath, filters);

	await updateManifest(manifest, dataPath, sources);
	return manifest
}
