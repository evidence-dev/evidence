import path from 'path';
import yaml from 'yaml';
import merge from 'lodash.merge';
import fs from 'fs/promises';
import { getSources, getSourcesDir } from './get-sources';

export const sepSecrets = (
	/** @type {*} */ opts,
	/** @type {Record<string, DatasourceOptionsSpec>} */ spec
) => {
	let secretOut = {};
	let varOut = {};
    if (typeof opts !== "object" || !opts) {
        console.warn(`Error processing options`)
        return { secret: {}, _var: {} }
    }
	for (const [key, value] of Object.entries(opts)) {
		if (key.startsWith('_')) continue;

		const s = spec[key];

        // TODO: We need to deal with children that get unnested here.
        // e.g. in the postgres options $.ssl.sslmode becomes $.sslmode, but the spec still has $.ssl.sslmode, leading to an error
        // TODO: On a similar note, when you enable ssl, pick an sslmode, and then disable ssl, the sslmode still remains.
        // We might need to just _force_ children to be nested for the sake of simplicity, but this may break how things are
        // now.
		if (typeof value === 'object') {
			if (s.children) {
                if (!(`_${key}` in opts)) continue
                /** @type {NonNullable<keyof typeof s.children>} */
				const realVal = opts[`_${key}`];
                
                if (!(realVal in s.children)) continue
                
                const newSpec = /** @type {Record<string, DatasourceOptionsSpec> | undefined} */ (s.children[realVal])
                if (!newSpec) continue
				const { secret, _var } = sepSecrets(value, newSpec);

				if (s.nest) {
					secretOut = Object.assign(secretOut, { [key]: secret });
					varOut = Object.assign(varOut, { [key]: _var });
				} else {
					secretOut = Object.assign(secretOut, secret);
					varOut = Object.assign(varOut, _var);
				}
			} else {
				const { secret, _var } = sepSecrets(value, s[key]);
				secretOut = Object.assign(secretOut, secret);
				varOut = Object.assign(varOut, _var);
			}
			continue;
		}

		if (s.secret) secretOut[key] = value;
		else varOut[key] = value;
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
            throw new Error(`Refusing to create source ${newOptions.name}, ${sourcePath} already exists.`)
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


    return {connYamlPath, optsYamlPath}
}

/**
 * @param {Partial<DatasourceSpec> & { type: string, name: string, initialName?: string }} newOptions
 * @param {Omit<PluginDatabases, "factory">} plugins
 */
export async function updateDatasourceOptions(newOptions, plugins) {
	// First; we need to divy this up into secret, and non secret values
	const usedPlugin = plugins[newOptions.type];

	const { secret, _var: vars } = sepSecrets(newOptions.options, usedPlugin.options);

	// Then; we need to check if the folder already exists; and if it does, load the existing
	// connection.yaml and connection.options.yaml

	const sourceDir = await getSourcesDir();

	if (!sourceDir) throw new Error('Unable to locate sources directory');


    const {optsYamlPath, connYamlPath} = await bootstrapSourceDirectory(newOptions, sourceDir)

	const connYamlContent = await fs
		.readFile(connYamlPath)
		.then((r) => r.toString())
		.then((r) => yaml.parse(r));
	const optsYamlContent = await fs
		.readFile(optsYamlPath)
		.then((r) => r.toString())
		.then((r) => yaml.parse(r));

	const mergedConnYaml = merge(connYamlContent, { options: vars, name: newOptions.name });
	const mergedOptsYaml = merge(optsYamlContent, secret);

	await fs.writeFile(
		connYamlPath,
		`# This file was automatically generated\n${yaml.stringify(mergedConnYaml)}`
	);
	await fs.writeFile(
		optsYamlPath,
		`# This file was automatically generated\n${yaml.stringify(mergedOptsYaml)}`
	);

    
    const updatedSource = (await getSources(sourceDir)).find(r => r.name === newOptions.name)
    if (!updatedSource) throw new Error(`Failed to locate datasource after update`)

    return updatedSource

}
