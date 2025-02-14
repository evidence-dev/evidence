import { EvidenceType } from '@evidence-dev/db-commons';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs/promises';
export const options = {};

export const createSourceTable = async (tableName, sourceDirectory) => {
	const newFilePath = path.join(sourceDirectory, `${tableName}.js`);

	// check if newFilePath already exists:

	if (await fs.exists(newFilePath)) {
		throw new Error(`File ${newFilePath} already exists`);
	}

	await fs.writeFile(
		newFilePath,
		`
let url = 'https://pokeapi.co/api/v2/pokemon/';

const response = await fetch(url);
const json = await response.json();

// The data export should contain an array of objects
// It is the only export that is used by Evidence
export const data = json.results;
`.trim()
	);

	return newFilePath;
};

/**
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */
export const getRunner = () => {
	return async (queryText, queryPath) => {
		if (queryPath.endsWith('.js')) {
			const module = await import(pathToFileURL(queryPath).href);
			const data = module.data;

			if (module.data) {
				const columnNames = Object.keys(data[0]);

				const output = {
					rows: data,
					columnTypes: columnNames.map((name) => ({
						name,
						evidenceType: (() => {
							switch (true) {
								case typeof data[0][name] === 'number':
									return EvidenceType.NUMBER;
								case typeof data[0][name] === 'boolean':
									return EvidenceType.BOOLEAN;
								// handle js dates but no other formats
								case data[0][name] instanceof Date:
									return EvidenceType.DATE;
								default:
									return EvidenceType.STRING;
							}
						})(),
						typeFidelity: 'inferred'
					})),
					expectedRowCount: data.length
				};

				return output;
			} else {
				throw new Error(`No { data } object exported from JavaScript file.`);
			}
		}
	};
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async () => {
	return true;
};
