/**
 * Restrictive DuckDB configuration for the HTTP SQL surface in serve mode.
 *
 * DuckDB's directory allowlist also permits WRITES inside the project.
 * This is not an OS sandbox or a read-only guarantee for project files.
 */
import { realpathSync } from 'node:fs';
import type { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBCredentials } from '@evidence/core/connectors/duckdb/credentials';

export function isHardenedDuckDBServe(): boolean {
	return process.env.EVIDENCE_SERVE === '1';
}

export function duckDBServeConfiguration(config: DuckDBCredentials): Record<string, string> {
	const root = realpathSync(config.projectDir);
	return {
		// The configuration is locked after instance initialization, so
		// relative CSV and Parquet paths must be configured up front.
		file_search_path: root,
		allow_community_extensions: 'false',
		allow_unsigned_extensions: 'false',
		autoinstall_known_extensions: 'false',
		autoload_known_extensions: 'false',
		allow_persistent_secrets: 'false',
		allow_unredacted_secrets: 'false',
		enable_global_s3_configuration: 'false',
		...(config.database === ':memory:' ? {} : { access_mode: 'READ_ONLY' })
	};
}

/**
 * Finish initialization before returning the instance to any HTTP query.
 * allowed_directories is a list-valued setting and is not accepted by the
 * node-api's scalar startup set_config implementation in DuckDB 1.5.6.
 */
export async function lockDownDuckDBInstance(
	instance: DuckDBInstance,
	config: DuckDBCredentials
): Promise<void> {
	const root = realpathSync(config.projectDir);
	const escapedRoot = root.replace(/'/g, "''");
	const connection = await instance.connect();
	try {
		await connection.runAndReadAll(`SET allowed_directories = ['${escapedRoot}']`);
		await connection.runAndReadAll('SET enable_external_access = false');
		await connection.runAndReadAll('SET lock_configuration = true');
	} finally {
		connection.closeSync();
	}
}
