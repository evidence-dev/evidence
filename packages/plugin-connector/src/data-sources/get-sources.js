import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import chalk from 'chalk';
import { DatasourceSpecFileSchema } from './schemas/datasource-spec.schema';
import { cleanZodErrors } from '../lib/clean-zod-errors.js';

/**
 * Returns the path to the sources directory, if it exists in the current directory.
 * If it doesn't exist, it logs a warning message and returns null.
 * @returns {Promise<string|null>} The path to the sources directory or null.
 */
export const getSourcesDir = async () => {
	// Get the absolute path to the current working directory
	const pwd = path.resolve('./');

	// Get the contents of the current directory
	const contents = await fs.readdir(pwd, { withFileTypes: true });

	// Find the sources directory in the contents
	const sourcesDir = contents.find((c) => c.name === 'sources' && c.isDirectory());

	// If sources directory doesn't exist, log a warning message
	if (!sourcesDir) {
		console.warn(chalk.yellow('[!] No Sources Found!'));
		return null;
	}

	// Return the path to the sources directory
	return path.join(pwd, 'sources');
};

/**
 * @param {string} sourceName
 * @returns {Record<string, string>}
 */
export const loadSourceOptions = (sourceName) => {
	/** @type {any} */
	const out = {};
	const keyRegex = /^EVIDENCE_SOURCE_([a-zA-Z]+?)_([a-zA-Z0-1_]+)$/;
	for (const [key, value] of Object.entries(process.env)) {
		const parts = keyRegex.exec(key);
		if (!parts) continue;
		if (parts?.length < 3) continue;
		if (parts[1].toLowerCase() !== sourceName.toLowerCase()) continue;
		const rawOptKey = parts[2].split('_');
		let t = out;
		for (const optKey of rawOptKey) {
			if (!t[optKey]) t[optKey] = {};
		}
		t[rawOptKey[rawOptKey.length - 1]] = value;
	}
	return out;
};

/**
 * Get a list of all sources and their connection info
 * @param {string} sourcesDir The path to the sources directory
 * @returns {Promise<DatasourceSpec[]>} An array of DatasourceSpecs
 */
export const getSources = async (sourcesDir) => {
	const sourcesDirectories = await fs.readdir(sourcesDir);
	/** @type {DatasourceSpec[]} */
	const datasourceSpecs = await Promise.all(
		sourcesDirectories.map(async (dirName) => {
			const sourceDir = path.join(sourcesDir, dirName);
			const contents = await fs.readdir(sourceDir);

			const connParams = await loadConnectionConfiguration(sourceDir);
			if (!connParams.name) connParams.name = /** @type {string} */ sourceDir.split(/[/\\]/).pop();

			if (!connParams.name)
				throw new Error(
					`Unexpected error determining datasource name, please add an explicit name in connection.yaml (${sourceDir})`
				);
			// Load Options from connection.options.yaml
			connParams.options = { ...connParams.options, ...(await loadConnectionOptions(sourceDir)) };
			// Load Options from Environment
			connParams.options = { ...connParams.options, ...loadSourceOptions(connParams.name) };

			const queries = await getQueries(sourceDir, contents);
			return {
				...connParams,
				sourceDirectory: sourceDir,
				queries: queries
			};
		})
	).then((r) => r.filter(Boolean));

	return datasourceSpecs;
};

/**
 * Reads a YAML file containing connection parameters from the given source directory,
 * parses it, and returns a validated datasource specification.
 *
 * @param {string} sourceDir - The directory containing the connection.yaml file.
 * @return {Promise<DatasourceSpecFile>} A Promise that resolves to a validated datasource specification.
 */
async function loadConnectionConfiguration(sourceDir) {
	const connParamsRaw = await fs
		.readFile(path.join(sourceDir, 'connection.yaml'))
		.then((r) => r.toString());

	let connParamsUnchecked;
	try {
		connParamsUnchecked = yaml.parse(connParamsRaw);
	} catch (e) {
		throw new Error(`Error parsing connection.yaml file; ${sourceDir}`, { cause: e });
	}

	const validationResult = DatasourceSpecFileSchema.safeParse(connParamsUnchecked);
	if (!validationResult.success) {
		console.error(chalk.bold.red(`[!] connection.yaml has errors (${sourceDir}`));
		const formattedError = cleanZodErrors(validationResult.error.format());
		console.error(chalk.red('|   Discovered Errors:'));
		const redPipe = chalk.red('|');
		console.error(
			`${redPipe}   ${yaml.stringify(formattedError).replace(/\n/g, `\n${redPipe}   `)}`
		);
		throw new Error('Unable to load connection.yaml');
	}
	return validationResult.data;
}

/**
 * @returns {Promise<any>}
 * @param {string} sourceDir
 */
async function loadConnectionOptions(sourceDir) {
	const optionsFilePath = path.join(sourceDir, 'connection.options.yaml');
	const optionsFileExists = await fs
		.stat(optionsFilePath)
		.then(() => true)
		.catch(() => false);
	if (!optionsFileExists) return {};
	const optionsFile = await fs.readFile(optionsFilePath).then((r) => r.toString());
	try {
		return yaml.parse(optionsFile);
	} catch (e) {
		throw new Error(`Error parsing connection.options.yaml file; ${sourceDir}`, { cause: e });
	}
}

/**
 * Retrieves the contents of all query files in the source directory,
 * excluding the 'connection.yaml' file, and returns them as an array of
 * objects containing the filepath and content of each query file.
 *
 * @param {string} sourceDir - The path to the source directory.
 * @param {Array<string>} contents - An array of filenames in the source directory.
 * @return {Promise<DatasourceQuery[]>} - A promise that resolves to an array of objects
 * containing the filepath and content of each query file.
 */
async function getQueries(sourceDir, contents) {
	const queryFiles = contents.filter(
		(s) => s !== 'connection.yaml' && s !== 'connection.options.yaml'
	);
	const queries = await Promise.all(
		queryFiles.map(async (filename) => ({
			filepath: `${sourceDir}/${filename}`,
			content: await fs.readFile(`${sourceDir}/${filename}`).then((r) => r.toString())
		}))
	);
	return queries;
}
