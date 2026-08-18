import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { loadConnectionConfig } from './load-config.ts';

let workDir: string;

beforeEach(async () => {
	workDir = await mkdtemp(path.join(tmpdir(), 'evidence-connection-test-'));
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

async function writeYaml(body: string): Promise<void> {
	await writeFile(path.join(workDir, 'connection.yaml'), body);
}

describe('loadConnectionConfig', () => {
	it('returns null when connection.yaml is absent', async () => {
		expect(await loadConnectionConfig(workDir)).toBeNull();
	});

	describe('snowflake', () => {
		// Required context fields, so each test only spells out what it's about.
		const base = `warehouse: COMPUTE_WH\ndatabase: ANALYTICS\n`;

		it('parses password auth', async () => {
			await writeYaml(
				`type: snowflake\naccount: xy12345.us-east-1\nuser: alice\npassword: hunter2\n${base}`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({
				type: 'snowflake',
				authType: 'password',
				account: 'xy12345.us-east-1',
				username: 'alice',
				password: 'hunter2',
				warehouse: 'COMPUTE_WH'
			});
		});

		it('parses inline private_key (key-pair auth)', async () => {
			// Any unencrypted PEM-shaped string passes — decrypt is a no-op when no BEGIN ENCRYPTED.
			const pem = '-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----';
			await writeYaml(
				`type: snowflake\naccount: a\nuser: alice\n${base}private_key: |\n  ${pem.replaceAll('\n', '\n  ')}\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({ type: 'snowflake', authType: 'key_pair', username: 'alice' });
			expect((cfg as { privateKey: string }).privateKey).toContain('BEGIN PRIVATE KEY');
		});

		it('rejects both password and private_key', async () => {
			await writeYaml(
				`type: snowflake\naccount: a\nuser: alice\n${base}password: p\nprivate_key: k\n`
			);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(
				/Provide only one of: password, private_key, private_key_path/
			);
		});

		it('rejects neither password nor key', async () => {
			await writeYaml(`type: snowflake\naccount: a\nuser: alice\n${base}`);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(
				/Provide one of: password, private_key, private_key_path/
			);
		});

		it('back-compat: legacy `schema: <string>` wraps to environments.production', async () => {
			await writeYaml(
				`type: snowflake\naccount: a\nuser: alice\npassword: p\n${base}schema: ANALYTICS_DEV\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect((cfg as { schema?: string }).schema).toBe('ANALYTICS_DEV');
		});

		it('accepts structured schemas object', async () => {
			await writeYaml(
				`type: snowflake\naccount: a\nuser: alice\npassword: p\n${base}schema:\n  production: PROD\n  devSchemas: [DEV_A, DEV_B]\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			// Resolver picks production unless overridden.
			expect((cfg as { schema?: string }).schema).toBe('PROD');
		});
	});

	describe('bigquery', () => {
		const validKeyfileJson = {
			type: 'service_account',
			project_id: 'p',
			client_email: 'sa@p.iam.gserviceaccount.com',
			private_key: '-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----\n'
		};

		it('parses inline keyfile_json (object form)', async () => {
			await writeYaml(
				`type: bigquery\nproject: my-gcp-project\ndataset: analytics\ndatasets: [analytics]\nkeyfile_json:\n  ${Object.entries(
					validKeyfileJson
				)
					.map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
					.join('\n  ')}\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({
				type: 'bigquery',
				projectId: 'my-gcp-project',
				defaultDataset: 'analytics'
			});
		});

		it('parses keyfile_json given as a JSON string', async () => {
			await writeYaml(
				`type: bigquery\nproject: p\ndatasets: [d]\nkeyfile_json: '${JSON.stringify(validKeyfileJson)}'\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({ type: 'bigquery', projectId: 'p' });
		});

		it('resolves keyfile path relative to cwd', async () => {
			await writeFile(path.join(workDir, 'sa.json'), JSON.stringify(validKeyfileJson));
			await writeYaml(`type: bigquery\nproject: p\ndatasets: [d]\nkeyfile: ./sa.json\n`);
			const cfg = await loadConnectionConfig(workDir);
			expect(
				(cfg as { serviceAccountJson: { client_email: string } }).serviceAccountJson.client_email
			).toBe(validKeyfileJson.client_email);
		});

		it('rejects when neither keyfile nor keyfile_json present', async () => {
			await writeYaml(`type: bigquery\nproject: p\ndatasets: [d]\n`);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(
				/Provide one of: keyfile_json, keyfile/
			);
		});
	});

	describe('clickhouse', () => {
		it('parses a Cloud config (TLS on 8443, default user/database)', async () => {
			await writeYaml(`type: clickhouse\nhost: abc.clickhouse.cloud\npassword: pw\n`);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toEqual({
				type: 'clickhouse',
				url: 'https://abc.clickhouse.cloud:8443',
				username: 'default',
				password: 'pw',
				accessToken: undefined,
				database: 'default',
				databases: []
			});
		});

		it('carries a databases allowlist through', async () => {
			await writeYaml(
				`type: clickhouse\nhost: abc.clickhouse.cloud\npassword: pw\ndatabases:\n  - analytics\n  - raw\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({ type: 'clickhouse', databases: ['analytics', 'raw'] });
		});

		it('honors username, database, and self-hosted plain HTTP', async () => {
			await writeYaml(
				`type: clickhouse\nhost: localhost\nport: 8123\nsecure: false\nusername: alice\npassword: pw\ndatabase: analytics\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({
				url: 'http://localhost:8123',
				username: 'alice',
				database: 'analytics'
			});
		});

		it('parses access_token (Cloud JWT) auth', async () => {
			await writeYaml(`type: clickhouse\nhost: abc.clickhouse.cloud\naccess_token: jwt\n`);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({ type: 'clickhouse', accessToken: 'jwt', password: undefined });
		});

		it('rejects a host with a protocol prefix', async () => {
			await writeYaml(`type: clickhouse\nhost: https://abc.clickhouse.cloud\npassword: pw\n`);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(/hostname only/);
		});

		it('rejects providing neither password nor access_token', async () => {
			await writeYaml(`type: clickhouse\nhost: abc.clickhouse.cloud\n`);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(/Provide one of/);
		});
	});

	describe('fabric', () => {
		const validBody =
			`type: fabric\n` +
			`server: abc123.datawarehouse.fabric.microsoft.com\n` +
			`database: analytics\n` +
			`tenantId: 11111111-1111-1111-1111-111111111111\n` +
			`clientId: 22222222-2222-2222-2222-222222222222\n` +
			`clientSecret: shhh\n`;

		it('parses service-principal config', async () => {
			await writeYaml(validBody);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({
				type: 'fabric',
				server: 'abc123.datawarehouse.fabric.microsoft.com',
				database: 'analytics',
				tenantId: '11111111-1111-1111-1111-111111111111',
				clientId: '22222222-2222-2222-2222-222222222222',
				clientSecret: 'shhh'
			});
		});

		it('rejects a missing clientSecret', async () => {
			await writeYaml(
				`type: fabric\nserver: abc123.datawarehouse.fabric.microsoft.com\ndatabase: analytics\ntenantId: t\nclientId: c\n`
			);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(/clientSecret/);
		});

		it('rejects a server given as a URL', async () => {
			await writeYaml(validBody.replace('server: abc123', 'server: https://abc123'));
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(/server/);
		});
	});

	it('rejects unknown type', async () => {
		await writeYaml(`type: redshift\n`);
		await expect(loadConnectionConfig(workDir)).rejects.toThrow(/unsupported type/);
	});

	describe('env interpolation', () => {
		it('substitutes ${VAR} from the environment', async () => {
			process.env.SERVE_TEST_CH_PASSWORD = 'hunter2';
			try {
				await writeYaml(
					`type: clickhouse\nhost: localhost\nport: 8123\nuser: default\npassword: \${SERVE_TEST_CH_PASSWORD}\ndatabase: default\n`
				);
				const cfg = await loadConnectionConfig(workDir);
				expect(cfg).toMatchObject({ type: 'clickhouse', password: 'hunter2' });
			} finally {
				delete process.env.SERVE_TEST_CH_PASSWORD;
			}
		});

		it('fails fast naming the unset variable', async () => {
			await writeYaml(
				`type: clickhouse\nhost: localhost\nport: 8123\nuser: default\npassword: \${SERVE_TEST_UNSET_VAR}\ndatabase: default\n`
			);
			await expect(loadConnectionConfig(workDir)).rejects.toThrow(/SERVE_TEST_UNSET_VAR/);
		});

		it('leaves non-matching text (lowercase, no braces) untouched', async () => {
			await writeYaml(
				`type: clickhouse\nhost: local$host\nport: 8123\nuser: default\npassword: $not_interp\ndatabase: default\n`
			);
			const cfg = await loadConnectionConfig(workDir);
			expect(cfg).toMatchObject({ url: expect.stringContaining('local$host'), password: '$not_interp' });
		});

		it('preserves secrets containing YAML-significant text verbatim', async () => {
			// Pre-parse interpolation would truncate at `#` or misparse `: ` — a
			// real warehouse password can contain either.
			process.env.SERVE_TEST_CH_PASSWORD = 'p#ss: w0rd';
			try {
				await writeYaml(
					`type: clickhouse\nhost: localhost\nport: 8123\nuser: default\npassword: \${SERVE_TEST_CH_PASSWORD}\ndatabase: default\n`
				);
				const cfg = await loadConnectionConfig(workDir);
				expect(cfg).toMatchObject({ password: 'p#ss: w0rd' });
			} finally {
				delete process.env.SERVE_TEST_CH_PASSWORD;
			}
		});

		it('preserves YAML-literal-looking secrets as strings', async () => {
			process.env.SERVE_TEST_CH_PASSWORD = 'true';
			try {
				await writeYaml(
					`type: clickhouse\nhost: localhost\nport: 8123\nuser: default\npassword: \${SERVE_TEST_CH_PASSWORD}\ndatabase: default\n`
				);
				const cfg = await loadConnectionConfig(workDir);
				expect(cfg).toMatchObject({ password: 'true' });
			} finally {
				delete process.env.SERVE_TEST_CH_PASSWORD;
			}
		});
	});
});
