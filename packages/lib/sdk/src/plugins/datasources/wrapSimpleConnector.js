import fs from 'fs/promises';
import { EvidenceError } from '../../lib/EvidenceError.js';
import path from 'path';
import { readFileSync, statSync } from 'fs';
import chalk from 'chalk';

/**
 * @param {import("./Datasources.js").Datasource} mod
 * @param {import('./schemas/datasource.schema.js').DatasourceSpec & {dir: string}} source
 * @returns {import('./types.js').ProcessSourceFn}
 */
export const wrapSimpleConnector = (mod, source) => {
	if (!('getRunner' in mod))
		throw new EvidenceError(
			'Internal Error',
			'Advanced connector was passed to wrapSimpleConnector. This should not occur'
		);
	/**
	 * @type {import('./types.js').ProcessSourceFn}
	 */
	return async function* (...args) {
		const [, , utils] = args;
		const runner = await mod.getRunner(source.options, source.dir);
		// TODO: Use fsproxy instead of fs
		/**
		 *
		 * @param {string} dir
		 * @returns {AsyncGenerator<import('./types.js').QueryResultTable | EvidenceError>}
		 */
		const processDir = async function* (dir) {
			const sourceFiles = await fs.readdir(dir, { withFileTypes: true });
			for (const sourceFile of sourceFiles) {
				// Why is the dirent interface so unstable?
				// This behaves differently depending on which minor version of 18 / 20 you are using
				const dirPath =
					// @ts-expect-error
					'parentPath' in sourceFile ? sourceFile.parentPath + '' : (sourceFile.path ?? dir);
				if (sourceFile.name === 'connection.yaml' || sourceFile.name === 'connection.options.yaml')
					continue;
				if (sourceFile.isDirectory()) {
					yield* processDir(path.join(dirPath, sourceFile.name));
					continue;
				}

				if (!sourceFile.isFile()) continue;

				const sourceFilePath = path.join(dirPath, sourceFile.name);
				const sourceFileName = sourceFile.name.split('.').at(0) ?? '';

				const stat = statSync(sourceFilePath);
				let sourceFileContent;
				if (stat.size > 1024 * 1024 * 32 /* 32 Megabytes */) {
					console.debug(chalk.dim('Will not eagerly load files larger than 32 Megabytes.'));
					sourceFileContent = '';
				} else {
					sourceFileContent = readFileSync(sourceFilePath, 'utf-8');
				}

				// Check if it should be skipped, and return an empty result (this is handled above)
				if (!utils.shouldRun(sourceFileName, sourceFileContent)) {
					yield utils.escape(sourceFileName, sourceFileContent);
					continue;
				}

				try {
					yield {
						name: /** @type {string} */ (sourceFileName),
						content: sourceFileContent,
						columnTypes: [],
						...(await runner(
							utils.subSourceVariables(sourceFileContent),
							sourceFilePath,
							source.buildOptions.batchSize ?? 1000 * 1000 // TODO: BatchSize configurable? Perhaps per-source plugin or per connection
						))
					};
				} catch (e) {
					let message = JSON.stringify(e);
					if (e instanceof Error) message = e.message;
					if (e instanceof EvidenceError) {
						e.metadata.tableName = sourceFileName;
						yield e;
					}
					yield new EvidenceError(
						message,
						[`${source.name}/${sourceFileName ?? ''} failed to execute`],
						{ cause: e },
						{ tableName: sourceFileName }
					);
				}
			}
		};

		yield* processDir(source.dir);
	};
};
