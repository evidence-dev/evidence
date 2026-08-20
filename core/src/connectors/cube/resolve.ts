import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CubeConnection } from './connection-schema';
import type { CubeCredentials } from './credentials';
import type { PostgresSslConfig } from '../postgres/credentials';

export type ResolveOpts = {
	/** Base directory for resolving the `ssl_*_path` file refs. */
	cwd: string;
};

async function readPem(
	inline: string | undefined,
	filePath: string | undefined,
	cwd: string,
	label: string
): Promise<string | undefined> {
	if (inline) return inline;
	if (!filePath) return undefined;
	const resolved = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
	try {
		return await readFile(resolved, 'utf-8');
	} catch (e) {
		throw new Error(`failed to read ${label} "${filePath}": ${(e as Error).message}`);
	}
}

/**
 * Config layer → execution layer for Cube. Mirrors postgres/resolve.ts (Cube shares
 * the pg-wire credential shape): reads any file-referenced TLS material at the trust
 * boundary so the executor receives ready-to-use PEM strings.
 */
export async function resolveCubeCredentials(
	config: CubeConnection,
	opts: ResolveOpts
): Promise<CubeCredentials> {
	const [ca, cert, key] = await Promise.all([
		readPem(config.ssl_ca, config.ssl_ca_path, opts.cwd, 'ssl_ca_path'),
		readPem(config.ssl_cert, config.ssl_cert_path, opts.cwd, 'ssl_cert_path'),
		readPem(config.ssl_key, config.ssl_key_path, opts.cwd, 'ssl_key_path')
	]);

	const ssl: PostgresSslConfig = {
		mode: config.sslmode,
		...(ca ? { ca } : {}),
		...(cert ? { cert } : {}),
		...(key ? { key } : {})
	};

	return {
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database,
		schema: config.schema,
		schemas: config.schemas,
		ssl
	};
}
