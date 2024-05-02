import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import * as tables from './tables.mjs';
/**
 *
 * @param {string} sourceDir Assumed to exist already
 * @param {string} libDir Assumed to exist already
 * @param {string} connectionName
 */
export const buildSocialMediaSources = async (sourceDir, libDir, connectionName) => {
	/** @type {*} */
	const queries = {};
	for (const [name, schema] of Object.entries(tables)) {
		await fs.writeFile(path.join(sourceDir, `${name}.yaml`), yaml.stringify(schema));

		queries[name] = {
			text: `SELECT * FROM ${connectionName}.${name}`,
			store: `Query.create("SELECT * FROM ${connectionName}.${name}", query)`
		};
	}
	return { social_media: queries };
};
