import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { decryptPemIfEncrypted } from './decrypt-pem';
import type { SnowflakeCredentials } from './credentials';
import type { SnowflakeConnection } from './connection-schema';

export type ResolveOpts = {
	/** Base directory for resolving `private_key_path`. */
	cwd: string;
	/** Active schema (e.g. viewer pick or dev override). Falls back to environments.production. */
	schema?: string;
};

/**
 * Config layer → execution layer. Reads any file-ref'd PEM, decrypts encrypted
 * PEMs at the trust boundary, collapses `environments` to a single `schema`,
 * and renames yaml-style fields to the SDK's camelCase names.
 */
export async function resolveSnowflakeCredentials(
	config: SnowflakeConnection,
	opts: ResolveOpts
): Promise<SnowflakeCredentials> {
	const schema = opts.schema ?? config.environments?.production;
	const base = {
		account: config.account,
		username: config.user,
		warehouse: config.warehouse,
		database: config.database,
		role: config.role,
		schema
	};

	if (config.password) {
		return { authType: 'password', ...base, password: config.password };
	}

	let pem: string;
	if (config.private_key) {
		pem = config.private_key;
	} else if (config.private_key_path) {
		const resolved = path.isAbsolute(config.private_key_path)
			? config.private_key_path
			: path.join(opts.cwd, config.private_key_path);
		try {
			pem = await readFile(resolved, 'utf-8');
		} catch (e) {
			throw new Error(
				`failed to read private_key_path "${config.private_key_path}": ${(e as Error).message}`
			);
		}
	} else {
		// Schema's auth-group check should have caught this — defensive.
		throw new Error('Snowflake credentials are missing password, private_key, and private_key_path');
	}

	return {
		authType: 'key_pair',
		...base,
		privateKey: decryptPemIfEncrypted(pem, config.private_key_passphrase)
	};
}
