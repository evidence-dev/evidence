import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SqlServerConnection } from './connection-schema';
import type { SqlServerCredentials } from './credentials';

export type ResolveOpts = {
	/** Base directory for resolving `ssl_ca_path`. */
	cwd: string;
};

// Config layer → execution layer: read the file-referenced CA at the trust boundary.
export async function resolveSqlServerCredentials(
	config: SqlServerConnection,
	opts: ResolveOpts
): Promise<SqlServerCredentials> {
	let ca = config.ssl_ca;
	if (!ca && config.ssl_ca_path) {
		const resolved = path.isAbsolute(config.ssl_ca_path)
			? config.ssl_ca_path
			: path.join(opts.cwd, config.ssl_ca_path);
		try {
			ca = await readFile(resolved, 'utf-8');
		} catch (e) {
			throw new Error(
				`failed to read ssl_ca_path "${config.ssl_ca_path}": ${(e as Error).message}`
			);
		}
	}

	return {
		server: config.server,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database,
		encrypt: config.encrypt,
		trustServerCertificate: config.trust_cert,
		...(ca ? { ca } : {}),
		schema: config.schema,
		schemas: config.schemas
	};
}
