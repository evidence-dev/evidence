// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			__db: {
				query(
					query: string,
					options?: {
						query_name?: string;
						callback?: (results: Record<string, unknown>[]) => unknown;
					}
				): void;
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
