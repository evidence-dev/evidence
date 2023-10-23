import { DatabaseConnectorSchema } from './schemas/query-runner.schema';
/**
 * Builds a database connector with the given package main and support types.
 *
 * @param {string} packageMain - The main file of the package to import.
 * @param {string[]} supports - An array of support types.
 * @return {Promise<DatabaseConnector>} A promise that resolves to the built database connector.
 */
export const buildConnector = async (packageMain, supports) => {
	// https://github.com/nodejs/node/issues/31710 thanks windows
	const crossPlatformPackage = new URL(`file:///${packageMain}`).href;
	const connectorPackage = await import(crossPlatformPackage /* @vite-ignore */);
	const connector = DatabaseConnectorSchema.parse({ ...connectorPackage, supports });

	return connector;
};
