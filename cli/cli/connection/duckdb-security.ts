/**
 * Restrictive DuckDB configuration for the untrusted HTTP SQL surface.
 *
 * This protects against file access outside the configured project and
 * disables extension auto-loading. A directory allowlist is not read-only:
 * SQL may still write inside the project, so this is not an OS sandbox.
 */
import { realpathSync } from 'node:fs';
import type { DuckDBCredentials } from '@evidence/core/connectors/duckdb/credentials';

export function isHardenedDuckDBServe(): boolean {
	return process.env.EVIDENCE_SERVE === '1';
}

export function duckDBServeConfiguration(config: DuckDBCredentials): Record<string, string> {
	const root = realpathSync(config.projectDir);

	// DuckDB configuration parses allowed_directories as a VARCHAR[] literal.
	const allowedDirectories = `['${root.replace(/'/g, "''")}']`;

	return {
		// Set the search path during instance creation; lock_configuration
		// prevents the previous per-query SET from changing it.
		file_search_path: root,
		allowed_directories: allowedDirectories,
		allow_community_extensions: 'false',
		allow_unsigned_extensions: 'false',
		autoinstall_known_extensions: 'false',
		autoload_known_extensions: 'false',
		allow_persistent_secrets: 'false',
		allow_unredacted_secrets: 'false',
		enable_global_s3_configuration: 'false',
		enable_external_access: 'false',
		...(config.database === ':memory:' ? {} : { access_mode: 'READ_ONLY' }),
		lock_configuration: 'true'
	};
}
