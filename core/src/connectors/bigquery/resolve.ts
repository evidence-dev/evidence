import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { BigQueryCredentials, BigQueryServiceAccountJson } from './credentials';
import type { BigQueryConnection } from './connection-schema';

export type ResolveOpts = {
	/** Base directory for resolving `keyfile`. */
	cwd: string;
};

/**
 * Config layer → execution layer. Reads any file-ref'd keyfile, parses inline
 * JSON strings, and renames yaml-style fields to the SDK's camelCase names.
 */
export async function resolveBigQueryCredentials(
	config: BigQueryConnection,
	opts: ResolveOpts
): Promise<BigQueryCredentials> {
	let serviceAccountJson: BigQueryServiceAccountJson;

	if (config.keyfile_json) {
		serviceAccountJson = config.keyfile_json as BigQueryServiceAccountJson;
	} else if (config.keyfile) {
		const resolved = path.isAbsolute(config.keyfile)
			? config.keyfile
			: path.join(opts.cwd, config.keyfile);
		let raw: string;
		try {
			raw = await readFile(resolved, 'utf-8');
		} catch (e) {
			throw new Error(`failed to read keyfile "${config.keyfile}": ${(e as Error).message}`);
		}
		try {
			serviceAccountJson = JSON.parse(raw) as BigQueryServiceAccountJson;
		} catch (e) {
			throw new Error(`keyfile "${config.keyfile}" is not valid JSON: ${(e as Error).message}`);
		}
	} else {
		// Schema's auth-group check should have caught this — defensive.
		throw new Error('BigQuery credentials are missing keyfile_json and keyfile');
	}

	return {
		authType: 'service_account_json',
		projectId: config.project,
		serviceAccountJson,
		location: config.location,
		defaultDataset: config.dataset
	};
}
