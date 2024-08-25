/** @typedef {import('../types.js').Manifest} Manifest */
/** @typedef {import("../schemas/datasource.schema.js").DatasourceSpecFile & { dir: string }} Source */
/** @typedef {import("../Datasources.js").DatasourceTuple} DatasourceTuple */
import { logQueryEvent } from '@evidence-dev/telemetry';
import chalk from 'chalk';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import { wrapSimpleConnector } from '../wrapSimpleConnector.js';
import { buildSourceUtils } from './buildSourceUtils.js';
import { buildSourceDirectoryProxy } from '../buildSourceDirectoryProxy.js';
import { buildSourceTable } from './buildSourceTable.js';
import ora from 'ora';

/**
 * @param {Source} source
 * @param {DatasourceTuple} plugin
 * @param {{dataPath: string, metaPath: string}} paths
 * @param {import('../types.js').SourceFilters} [filters]
 * @param {boolean} [strict]
 * @returns {Promise<{located: string[], rendered: string[]}>}
 */
export const evalSource = async (source, plugin, paths, filters, strict) => {
	/**
	 * @type {{located: string[], rendered: string[]}}
	 */
	const out = {
		located: [],
		rendered: []
	};

	console.log(chalk.dim('-'.repeat(5)));
	console.log(chalk.green(`  [Processing] ${chalk.bold(source.name)}`));

	if (!plugin) {
		logQueryEvent('source-connector-not-found', source.type, source.name);
		// TODO: How forgiving do we want to be here?
		// TODO: If we want to be really fancy; we could batch these, and do an NPM lookup at the end to say "these packages provide those datasources"
		throw new EvidenceError(
			`Could not find matching datasource plugin for ${chalk.bold(
				source.name
			)} (source: ${chalk.bold(source.type)})`
		);
	}

	const [, sourcePlugin] = plugin;

	await testSourceConnection(sourcePlugin, source);

	/** @type {import('../types.js').ProcessSourceFn} */
	const processSource =
		'processSource' in sourcePlugin
			? sourcePlugin.processSource
			: wrapSimpleConnector(sourcePlugin, source);

	const utils = buildSourceUtils(source, filters);
	const tablesIterator = processSource(
		source.options,
		await buildSourceDirectoryProxy(source.dir),
		utils
	)[Symbol.asyncIterator](); // this is required for typescript to be happy

	/** @type {IteratorResult<import('../types.js').QueryResultTable<any> | EvidenceError>} */
	let iterResult;
	while (((iterResult = await tablesIterator.next()), !iterResult.done)) {
		if (iterResult.done) continue;
		if (iterResult.value instanceof Error) {
			// handle error
			const error = iterResult.value;
			let tableName = 'Unknown';
			if (error instanceof EvidenceError) {
				if (error.metadata.tableName) tableName = error.metadata.tableName;
			}
			ora({
				prefixText: `  ${tableName}`,
				spinner: 'triangle',
				discardStdin: false,
				interval: 250
			}).fail(`Error: ${error.message}`);
			logQueryEvent('db-error', source.type, source.name, tableName);
			if (strict) throw error;
			continue;
		}
		// handle success
		const outputTables = await buildSourceTable(source, iterResult.value, utils, paths);
		for (const outputTable of outputTables ?? []) {
			out.located.push(outputTable.name);
			out.rendered.push(outputTable.filepath);
		}
	}

	return out;
};

/**
 * @param {DatasourceTuple[1]} sourcePlugin
 * @param {Source} source
 */
export async function testSourceConnection(sourcePlugin, source) {
	const testResult = await sourcePlugin.testConnection(source.options, source.dir);
	if (testResult !== true) {
		logQueryEvent('db-connection-error', source.type, source.name);
		throw new EvidenceError(
			`Error connecting to datasource ${chalk.bold(source.name)}: ${testResult.reason}`
		);
	} else {
		logQueryEvent('db-connection-success', source.type, source.name);
	}
}
