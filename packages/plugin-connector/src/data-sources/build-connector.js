import chalk from 'chalk';
import yaml from 'yaml';
import { cleanZodErrors } from '../lib/clean-zod-errors';
import { DatabaseConnectorSchema } from './schemas/query-runner.schema';
/**
 * Builds a database connector with the given package main and support types.
 *
 * @param {string} packageMain - The main file of the package to import.
 * @param {string[]} supports - An array of support types.
 * @param {string} packageName - Name of the connector package; used for error outputs
 * @return {Promise<DatabaseConnector>} A promise that resolves to the built database connector.
 */
export const buildConnector = async (packageMain, supports, packageName) => {
	// https://github.com/nodejs/node/issues/31710 thanks windows
	const crossPlatformPackage = new URL(`file:///${packageMain}`).href;
	await import(packageMain);
	console.log('FEEE');
	const connectorPackage = await import(crossPlatformPackage /* @vite-ignore */);
	const connector = DatabaseConnectorSchema.safeParse({ ...connectorPackage, supports });

	if (!connector.success) {
		console.error(chalk.bold.red(`[!] Database connector ${packageName} is invalid`));
		const formattedError = cleanZodErrors(connector.error.format());
		console.error(chalk.red('|   Discovered Errors:'));
		const redPipe = chalk.red('|');
		console.error(
			`${redPipe}   ${yaml.stringify(formattedError).replace(/\n/g, `\n${redPipe}   `)}`
		);
		process.exit(1);
	} else {
		return connector.data;
	}
};
