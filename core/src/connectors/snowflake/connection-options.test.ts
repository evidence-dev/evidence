import { describe, it, expect } from 'vitest';
import { buildConnectionOptions } from './connection-options';
import { normalizeCredentials, type SnowflakeCredentials } from './credentials';

describe('buildConnectionOptions', () => {
	it('uses password authenticator and includes password for password auth', () => {
		const credentials: SnowflakeCredentials = {
			authType: 'password',
			account: 'acct',
			username: 'u',
			password: 'secret',
			warehouse: 'WH',
			database: 'DB',
			role: 'R'
		};
		const opts = buildConnectionOptions(credentials);
		expect(opts.password).toBe('secret');
		expect(opts.authenticator).toBeUndefined();
		expect('privateKey' in opts).toBe(false);
		expect(opts.account).toBe('acct');
		expect(opts.username).toBe('u');
		expect(opts.warehouse).toBe('WH');
		expect(opts.database).toBe('DB');
		expect(opts.role).toBe('R');
		expect(opts.application).toBe('EvidenceStudio');
	});

	it('uses SNOWFLAKE_JWT and passes the (already-decrypted) private key through', () => {
		const pem = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----';
		const credentials: SnowflakeCredentials = {
			authType: 'key_pair',
			account: 'acct',
			username: 'u',
			privateKey: pem
		};
		const opts = buildConnectionOptions(credentials);
		expect(opts.authenticator).toBe('SNOWFLAKE_JWT');
		expect(opts.privateKey).toBe(pem);
		expect(opts.password).toBeUndefined();
	});

	it.each([
		'evil-target/somepath',
		'acct?x=1',
		'acct#fragment',
		'acct@host',
		'acct:443',
		'',
		undefined
	])('refuses to hand the driver a locator carrying %s', (account) => {
		const credentials = {
			authType: 'password',
			account,
			username: 'u',
			password: 'p'
		} as unknown as SnowflakeCredentials;
		expect(() => buildConnectionOptions(credentials)).toThrow(/can only contain alphanumeric/);
	});

	it.each(['xy12345.us-east-1', 'xy12345.us-east-1.privatelink', 'myorg-my_account', 'ab12345'])(
		'passes a real locator (%s) through untouched',
		(account) => {
			const credentials: SnowflakeCredentials = {
				authType: 'password',
				account,
				username: 'u',
				password: 'p'
			};
			expect(buildConnectionOptions(credentials).account).toBe(account);
		}
	);
});

describe('normalizeCredentials', () => {
	it('defaults to password auth when authType is missing (legacy vault secrets)', () => {
		const legacy = { account: 'acct', username: 'u', password: 'p' };
		const normalized = normalizeCredentials(legacy);
		expect(normalized.authType).toBe('password');
	});

	it('preserves key_pair authType', () => {
		const creds = {
			authType: 'key_pair' as const,
			account: 'acct',
			username: 'u',
			privateKey: 'key'
		};
		const normalized = normalizeCredentials(creds);
		expect(normalized.authType).toBe('key_pair');
	});

	it('throws a readable error when credentials are null', () => {
		expect(() => normalizeCredentials(null)).toThrow(/missing or invalid/);
		expect(() => normalizeCredentials(undefined)).toThrow(/missing or invalid/);
	});
});
