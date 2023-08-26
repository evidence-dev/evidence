// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			__db: {
				/**
				 *
				 * @param query - the SQL query to execute
				 * @param options - an object providing optional functionality.
				 *
				 * Supplying `query_name` will cause the query's results to be available on the page as `data[query_name]`.
				 *
				 * Supplying `callback` will run the callback synchronously with the results on the server, and asynchronously on the client.
				 * - `callback` is run as the results are being returned from the query - `return callback(results)`
				 * - This allows for less duplicated code to account for the two runtimes
				 * - `callback` defaults to the identity function, `(x) => x`
				 */
				query<T = Record<string, unknown>[]>(
					query: string,
					options?: {
						query_name?: string;
					}
				): T | Promise<T>;
				query<T>(
					query: string,
					options: {
						query_name?: string;
						callback: (results: Record<string, unknown>[]) => T;
					}
				): T | Promise<T>;
				/**
				 * Waits for database to finish loading
				 * This includes fetching `manifest.json`, intitializing the WASM and WebWorker
				 * setting up parquet connections, and updating the schema search path
				 */
				load(): Promise<void>;
			};
			data: Record<string, Record<string, unknown>[]>;
			customFormattingSettings: {
				version: string;
				customFormats: unknown[];
			};
			isUserPage: boolean;
			evidencemeta: {
				queries: {
					id: string;
					compiledQueryString: string;
					inputQueryString: string;
					compiled: boolean;
					inline: true;
				};
			};
		}
		// interface Platform {}
	}
}

export {};
