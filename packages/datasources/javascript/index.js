import { EvidenceType } from '@evidence-dev/db-commons';
import { pathToFileURL } from 'url';

export const options = {};

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
						evidenceType:
							typeof data[0][name] === 'number'
								? EvidenceType.NUMBER
								: data[0][name] instanceof Date
									? EvidenceType.DATE
									: EvidenceType.STRING,
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
