import { arrowTableToJSON } from './both.js';
import { tableFromIPC } from 'apache-arrow';
export { tableFromIPC };

export async function initDB() {}
export async function updateSearchPath() {}
export async function emptyDbFs() {}
export async function setParquetURLs() {}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import("apache-arrow").Table | null>}
 */
export function query(sql) {
	return fetch('https://light-locally-crane.ngrok-free.app/api/executor', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query: sql })
	})
		.then(tableFromIPC)
		.then(arrowTableToJSON);
}

export { arrowTableToJSON };
