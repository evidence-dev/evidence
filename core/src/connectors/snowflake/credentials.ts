export type SnowflakeAuthType = 'password' | 'key_pair';

type SnowflakeConnectionParams = {
	account: string;
	warehouse?: string;
	database?: string;
	schema?: string;
	role?: string;
};

export type SnowflakePasswordCredentials = SnowflakeConnectionParams & {
	authType: 'password';
	username: string;
	password: string;
};

/**
 * Persisted key-pair credentials. `privateKey` is always an unencrypted
 * PKCS#8 PEM — encrypted PEMs and their passphrases are decrypted at the
 * trust boundary (form save, CLI load) and never stored together.
 */
export type SnowflakeKeyPairCredentials = SnowflakeConnectionParams & {
	authType: 'key_pair';
	username: string;
	privateKey: string;
};

export type SnowflakeCredentials = SnowflakePasswordCredentials | SnowflakeKeyPairCredentials;

/**
 * Treat credentials missing `authType` (e.g. secrets created before key-pair
 * support) as password auth.
 */
export function normalizeCredentials(raw: unknown): SnowflakeCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('Snowflake credentials are missing or invalid');
	}
	const creds = raw as SnowflakeCredentials & { authType?: string };
	if (creds.authType === 'key_pair') return creds as SnowflakeCredentials;
	return { ...creds, authType: 'password' } as SnowflakeCredentials;
}
