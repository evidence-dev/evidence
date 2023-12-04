import path from 'path';
import yaml from 'yaml';
import merge from 'lodash.merge';
import fs from 'fs/promises';
import { getSourcesDir } from './get-sources';
import { getDatasourceOptions } from '.';

/**
 * @typedef {Record<string, string | number | boolean | *>} OptsObject
 */

export const sepSecrets = (
	/** @type {OptsObject} */ opts,
	/** @type {DatasourceOptionsSpec} */ spec
) => {
	/** @type {*} */
	let secretOut = {};
	/** @type {*} */
	let varOut = {};

	if (typeof opts !== 'object' || !opts) {
		console.warn(`Error processing options`);
		return { secret: {}, _var: {} };
	}
	for (const [key, value] of Object.entries(spec)) {
		if (value.virtual) continue;
		const metakey = `_${key}`;
		/** @type {string | number | boolean | symbol } */
		const valuekey = value.children && value.nest ? metakey : key;
		if (value.children) {
			/** @type {string | number | boolean | object} */
			const optsValueKey = opts[valuekey];
			if (typeof optsValueKey === 'object') {
				/* TODO: Something is wrong? */ continue;
			}
			const targetSpec = value.children[optsValueKey.toString()];
			if (targetSpec) {
				// The current value for this field has children
				if (value.nest) {
					const optKey = opts[key];
					if (typeof optKey !== 'object') {
						/* TODO: Something is wrong? */ continue;
					}
					// Recurse, looking at the nested options object
					const { secret, _var } = sepSecrets(optKey, targetSpec);
					varOut[key] = _var;
					secretOut[key] = secret;
				} else {
					// Recurse, applying the child schema to the same options object
					const { secret, _var } = sepSecrets(opts, targetSpec);
					varOut = merge(varOut, _var);
					secretOut = merge(secretOut, secret);
					if (value.secret) {
						secretOut[key] = opts[key];
					} else {
						varOut[key] = opts[key];
					}
				}
			} else {
				if (value.secret) {
					secretOut[key] = opts[key];
				} else {
					varOut[key] = opts[key];
				}
			}
		} else {
			if (value.secret) {
				secretOut[key] = opts[key];
			} else {
				varOut[key] = opts[key];
			}
		}
	}

	return { secret: secretOut, _var: varOut };
};

/**
 *
 * @param {*} newOptions
 * @param {string} sourceDir
 * @returns
 */
export async function bootstrapSourceDirectory(newOptions, sourceDir) {
	const sourcePath = newOptions.sourceDirectory ?? path.join(sourceDir, newOptions.name);
	const sourceDirectories = await fs.readdir(sourceDir);

	if (!newOptions.sourceDirectory) {
		// We're dealing with a new package here.
		if (sourceDirectories.includes(newOptions.name)) {
			// We would be creating a new directory, but it already exists. We should bail
			throw new Error(
				`Refusing to create source ${newOptions.name}, ${sourcePath} already exists.`
			);
		}
		await fs.mkdir(sourcePath);
	}

	const sourceDirContent = await fs.readdir(sourcePath);

	const connYamlPath = path.join(sourcePath, 'connection.yaml');
	const optsYamlPath = path.join(sourcePath, 'connection.options.yaml');

	if (!sourceDirContent.includes('connection.yaml')) {
		await fs.writeFile(
			connYamlPath,
			`# This file was automatically generated
name: ${newOptions.name}
type: ${newOptions.type}`
		);
	}
	if (!sourceDirContent.includes('connection.options.yaml')) {
		await fs.writeFile(optsYamlPath, '');
	}

	return { connYamlPath, optsYamlPath };
}

/**
 * @param {Partial<DatasourceSpec> & { type: string, name: string, initialName?: string }} newOptions
 * @param {Omit<PluginDatabases, "factory">} plugins
 * @returns {Promise<DatasourceSpec>}
 */
export async function updateDatasourceOptions(newOptions, plugins) {
	/** @param {*} o */
	const denull = (o) =>
		Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));

	// First; we need to divy this up into secret, and non secret values
	const usedPlugin = plugins[newOptions.type];

	const { secret, _var: vars } = sepSecrets(denull(newOptions.options), usedPlugin.options);

	// Then; we need to check if the folder already exists; and if it does, load the existing
	// connection.yaml and connection.options.yaml

	const sourceDir = await getSourcesDir();

	if (!sourceDir) throw new Error('Unable to locate sources directory');

	const { optsYamlPath, connYamlPath } = await bootstrapSourceDirectory(newOptions, sourceDir);

	const connYamlContent = await fs
		.readFile(connYamlPath, { encoding: 'utf8' })
		.then((r) => yaml.parse(r));

	const mergedConnYaml = merge(
		{ ...connYamlContent, options: undefined },
		{ options: vars, name: newOptions.name }
	);

	const mergedOptsYaml = secret;

	await fs.writeFile(
		connYamlPath,
		`# This file was automatically generated\n${yaml.stringify(denull(mergedConnYaml))}`
	);
	await fs.writeFile(
		optsYamlPath,
		`# This file was automatically generated\n${yaml.stringify(denull(mergedOptsYaml))}`
	);



	const updatedSource = (await getDatasourceOptions(sourceDir)).find((r) => r.name === newOptions.name);
	
	if (!updatedSource) throw new Error(`Failed to locate datasource after update`);

	return updatedSource;
}
