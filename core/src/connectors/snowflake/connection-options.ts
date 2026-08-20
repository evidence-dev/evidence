import type { ConnectionOptions } from 'snowflake-sdk';
import type { SnowflakeCredentials } from './credentials';
import { ACCOUNT_LOCATOR_MESSAGE, isValidAccountLocator } from './account-locator';

export type BuildConnectionOptions = {
	/**
	 * SDK retry budget in seconds. Defaults to the SDK's own 300s for normal
	 * pooled queries; lower (e.g. 15) for "test connection" UX so a typo'd
	 * account locator fails fast instead of looking hung.
	 */
	retryTimeout?: number;
};

/**
 * Build the options object passed to snowflake.createConnection / createPool.
 * Branches on authType to select password vs. JWT key-pair authentication.
 *
 * The key-pair branch assumes `privateKey` is already an unencrypted PKCS#8
 * PEM — that's the contract of the persisted credentials shape. Decryption
 * happens at the trust boundary (form save, CLI load).
 */
export function buildConnectionOptions(
	credentials: SnowflakeCredentials,
	opts: BuildConnectionOptions = {}
): ConnectionOptions {
	// A stored secret never re-enters the form schema, so this is the last edge.
	if (!isValidAccountLocator(credentials.account)) {
		throw new Error(ACCOUNT_LOCATOR_MESSAGE);
	}
	const base = {
		account: credentials.account,
		username: credentials.username,
		warehouse: credentials.warehouse,
		database: credentials.database,
		schema: credentials.schema,
		role: credentials.role,
		application: 'EvidenceStudio',
		...(opts.retryTimeout !== undefined && { retryTimeout: opts.retryTimeout })
	};
	if (credentials.authType === 'key_pair') {
		return {
			...base,
			authenticator: 'SNOWFLAKE_JWT',
			privateKey: credentials.privateKey
		};
	}
	return { ...base, password: credentials.password };
}
