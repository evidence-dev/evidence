import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { redPipe } from '../../lib/tokens.js';
import { EvidenceError } from '../../lib/EvidenceError.js';
import { cleanZodErrors } from '../../lib/cleanZodErrors.js';
import { DatasourceSpecFileSchema } from './schemas/datasource.schema.js';
import { decodeBase64Deep } from '../../lib/b64Deep.js';

/**
 * @param {string} sourceDir
 * @deprecated Use loadSourceConfig
 */
export const loadConnectionOptions = async (sourceDir) => {
	const optionsFilePath = path.join(sourceDir, 'connection.options.yaml');
	const optionsFileExists = await fs
		.stat(optionsFilePath)
		.then(() => true)
		.catch(() => false);
	if (!optionsFileExists) return {};
	const optionsFile = await fs.readFile(optionsFilePath).then((r) => r.toString());
	try {
		// TODO: Should we make the b64 encoding optional? (e.g. prefix with b64: to indicate encoding intent)
		return decodeBase64Deep(yaml.parse(optionsFile));
	} catch (e) {
		throw new EvidenceError(`Error parsing connection.options.yaml file; ${sourceDir}`, [], {
			cause: e
		});
	}
};
/**
 * @param {string} sourceName
 * @deprecated Use loadSourceConfig
 */
export const loadConnectionEnvironment = async (sourceName) => {
	/** @type {any} */
	const out = {};
	const keyRegex = /^EVIDENCE_SOURCE__([a-zA-Z0-9_]+)$/;
	for (const [key, value] of Object.entries(process.env)) {
		const parts = keyRegex.exec(key);
		if (!parts) continue;
		if (parts?.length < 2) continue;
		if (!parts[1].toLowerCase().startsWith(sourceName.toLowerCase())) continue;
		const rawOptKey = parts[1].substring(sourceName.length + 2).split('__');
		let t = out;

		rawOptKey.forEach((key, i) => {
			if (i < rawOptKey.length - 1) {
				// We haven't reached the final key
				if (!t[key]) t[key] = {};
				t = t[key];
			} else {
				t[key] = value;
			}
		});
	}
	return out;
};

/**
 * @param {string} sourceDir
 * @deprecated Use loadSourceConfig
 * @returns {Promise<import('./schemas/datasource.schema.js').DatasourceSpecFile | false>}
 */
export const loadConnection = async (sourceDir) => {
	const connParamsRaw = await fs
		.readFile(path.join(sourceDir, 'connection.yaml'))
		.then((r) => r.toString())
		.catch(
			/** @returns {false} */
			(e) => {
				console.warn(
					chalk.yellow(`[!] ${sourceDir} is not a valid source (no connection.yaml); skipping`)
				);
				console.warn(e.message);
				return false;
			}
		);
	if (connParamsRaw === false) return false;

	let connParamsUnchecked;
	try {
		connParamsUnchecked = yaml.parse(connParamsRaw);
	} catch (e) {
		throw new EvidenceError(`Error parsing connection.yaml file; ${sourceDir}`, undefined, {
			cause: e
		});
	}

	const validationResult = DatasourceSpecFileSchema.safeParse(connParamsUnchecked);
	if (!validationResult.success) {
		const formattedError = cleanZodErrors(validationResult.error.format());
		const context = [
			chalk.bold.red(`[!] connection.yaml has errors (${sourceDir}`),
			chalk.red('|   Discovered Errors:'),
			`${redPipe}   ${yaml.stringify(formattedError).replace(/\n/g, `\n${redPipe}   `)}`
		];
		throw new EvidenceError('Unable to load connection.yaml', context);
	}

	return validationResult.data;
};

/**
 * @param {string} sourceDir
 * @returns {Promise<import('./schemas/datasource.schema.js').DatasourceSpecFile | false>}
 */
export const loadSourceConfig = async (sourceDir) => {
	const connectionConfig = await loadConnection(sourceDir);
	if (!connectionConfig) return false;
	const options = Object.assign(
		{},
		connectionConfig.options ?? {},
		await loadConnectionOptions(sourceDir),
		await loadConnectionEnvironment(connectionConfig.name)
	);
	return {
		...connectionConfig,
		options
	};
};
