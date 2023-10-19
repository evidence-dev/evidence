/**
 * @typedef {object} DatasourceOptionsPayload
 * @property {string} name
 * @property {string} type
 * @property {string} package
 * @property {object} options
 */

import path from "path";
import yaml from "yaml";
import merge from "lodash.merge"
import fs from "fs/promises";
import { getSourcesDir } from "./get-sources";

export const sepSecrets = (opts, spec) => {
    let secretOut = {};
    let varOut = {};
    for (const [key, value] of Object.entries(opts)) {
        if (key.startsWith("_")) continue

        const s = spec[key]
        if (typeof value === 'object') {
            if (s.children) {
                const realVal = opts[`_${key}`]
                const {secret, _var} = sepSecrets(value, s.children[realVal])
                
                if (s.nest) {
                    secretOut = Object.assign(secretOut, {[key]:secret})
                    varOut = Object.assign(varOut, {[key]:_var})    
                } else {
                    secretOut = Object.assign(secretOut, secret)
                    varOut = Object.assign(varOut, _var)                            
                }
            } else {
                const {secret, _var} = sepSecrets(value, s[key]);
                secretOut = Object.assign(secretOut, secret)
                varOut = Object.assign(varOut, _var)
            }
            continue;
        }
        
        if (s.secret) secretOut[key] = value;
        else varOut[key] = value;
    }
    
    return { secret: secretOut, _var: varOut}
}

/**
 * @param {DatasourceOptionsPayload} newOptions
 * @param {Omit<PluginDatabases, "factory">} plugins
 */
export async function updateDatasourceOptions(newOptions, plugins) {
	if (!(newOptions.type in plugins)) {
		console.log({ newOptions, plugins });
		throw new Error(
			`${newOptions.package} for ${newOptions.type} not found. Cannot save options for ${newOptions.name}`
		);
	}
	// First; we need to divy this up into secret, and non secret values
	const usedPlugin = plugins[newOptions.type];

    const { secret, _var: vars } = sepSecrets(newOptions.options, usedPlugin.options)

	// Then; we need to check if the folder already exists; and if it does, load the existing
	// connection.yaml and connection.options.yaml

    const sourceDir = await getSourcesDir()

    if (!sourceDir) throw new Error("Unable to locate sources directory")
    
    const newPath = path.join(sourceDir, newOptions.name)
    
    const sourceDirectories = await fs.readdir(sourceDir)
    if (!sourceDirectories.includes(newOptions.name)) {
        await fs.mkdir(newPath)
    }

    const sourceDirContent = await fs.readdir(newPath)

    const connYamlPath = path.join(newPath, "connection.yaml")
    const optsYamlPath = path.join(newPath, "connection.options.yaml")

    if (!sourceDirContent.includes("connection.yaml")) {
        await fs.writeFile(connYamlPath, `# This file was automatically generated
name: ${newOptions.name}
type: ${newOptions.type}`)
    }
    if (!sourceDirContent.includes("connection.options.yaml")) {
        await fs.writeFile(optsYamlPath, "")
    }

    const connYamlContent = await fs.readFile(connYamlPath).then(r => r.toString()).then(r => yaml.parse(r))
    const optsYamlContent = await fs.readFile(optsYamlPath).then(r => r.toString()).then(r => yaml.parse(r))

    const mergedConnYaml = merge(connYamlContent, { options: vars })
    const mergedOptsYaml = merge(optsYamlContent, secret)

    console.log(yaml.stringify(mergedOptsYaml))

    await fs.writeFile(connYamlPath, `# This file was automatically generated\n${yaml.stringify(mergedConnYaml)}`)
    await fs.writeFile(optsYamlPath, `# This file was automatically generated\n${yaml.stringify(mergedOptsYaml)}`)
}
