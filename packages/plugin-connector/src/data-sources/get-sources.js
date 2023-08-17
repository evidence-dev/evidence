import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import chalk from 'chalk';
import { DatasourceSpecFileSchema, DatasourceCacheSchema } from './schemas/datasource-spec.schema';
import { cleanZodErrors } from '../lib/clean-zod-errors.js';
import { createHash } from 'node:crypto';

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
 * @returns {any}
 */
export const loadSourceOptions = (sourceName) => {
	/** @type {any} */
	const out = {};
	const keyRegex = /^EVIDENCE_SOURCE_([a-zA-Z0-1_]+)$/;
	for (const [key, value] of Object.entries(process.env)) {
		const parts = keyRegex.exec(key);
		if (!parts) continue;
		if (parts?.length < 2) continue;
		if (!parts[1].toLowerCase().startsWith(sourceName.toLowerCase())) continue;
		const rawOptKey = parts[1].substring(sourceName.length + 1).split('_');
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
			const possibleDir = await fs.stat(sourceDir);
			if (!possibleDir.isDirectory()) return false;

			const contents = await fs.readdir(sourceDir);

			const connParams = await loadConnectionConfiguration(sourceDir);
			if (!connParams.name)
				connParams.name = /** @type {string} */ (sourceDir.split(path.sep).pop());

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
	).then((r) => /** @type {Exclude<typeof r[number], false>[]} */ (r.filter(Boolean)));

	return datasourceSpecs;
};

const hash_location = './.evidence/template/.evidence-queries/sources/hashes.json';

/**
 * Gets the hashes of all source files, at the time of their last execution.
 * @returns {Promise<Record<string, Record<string, string | null>>>}
 */
export async function getPastSourceHashes() {
	const hashes = await fs.readFile(hash_location, 'utf-8').catch(() => '{}');
	const parsed = JSON.parse(hashes);
	const validated = DatasourceCacheSchema.safeParse(parsed);

	if (!validated.success) {
		console.error(chalk.bold.red('[!] Unable to parse source query hashes, ignoring'));
		await fs.writeFile(hash_location, '{}');
		return {};
	}

	return validated.data;
}

/**
 * Saves the supplied source hashes
 * @param {Record<string, Record<string, string | null>>} hashes
 */
export async function saveSourceHashes(hashes) {
	await fs.mkdir(path.dirname(hash_location), { recursive: true });
	await fs.writeFile(hash_location, JSON.stringify(hashes));
}

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
		queryFiles.map(async (filename) => {
			const filepath = path.join(sourceDir, filename);
			const { size } = await fs.stat(filepath);
			let content, hash;
			if (size > 100 * 1024 * 1024) {
				console.warn(`${filename} is over 100MB, skipping`);
				content = null;
				hash = null;
			} else {
				content = await fs.readFile(path.join(sourceDir, filename)).then((r) => r.toString());
				hash = createHash('md5').update(content).digest('hex');
			}

			return { filepath, content, hash, name: path.basename(filepath).split('.')[0] };
		})
	);

	return queries;
}
