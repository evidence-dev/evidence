import { DatabaseConnectorSchema } from './schemas/query-runner.schema';
/**
 * Builds a database connector with the given package main and support types.
 *
 * @param {string} packageMain - The main file of the package to import.
 * @param {string[]} supports - An array of support types.
 * @return {Promise<DatabaseConnector>} A promise that resolves to the built database connector.
 */
export const buildConnector = async (packageMain, supports) => {
	const connectorPackage = await import(packageMain);
	const connector = DatabaseConnectorSchema.parse({ ...connectorPackage, supports });

	return connector;
};
