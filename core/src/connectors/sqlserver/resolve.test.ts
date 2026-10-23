import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sqlserverConnectionSchema } from './connection-schema';
import { resolveSqlServerCredentials } from './resolve';

const base = {
	type: 'sqlserver',
	server: 'sql.example.com',
	user: 'svc_evidence',
	password: 'pw',
	database: 'DW'
};

describe('sqlserverConnectionSchema', () => {
	it('applies secure defaults', () => {
		const parsed = sqlserverConnectionSchema.parse(base);
		expect(parsed).toMatchObject({ port: 1433, encrypt: true, trust_cert: false, schema: 'dbo' });
	});

	it('rejects connection strings and URLs in server', () => {
		for (const server of ['sqlserver://sql.example.com', 'Server=sql.example.com;Database=DW']) {
			expect(sqlserverConnectionSchema.safeParse({ ...base, server }).success).toBe(false);
		}
	});

	it('rejects both an inline CA and a CA path', () => {
		const result = sqlserverConnectionSchema.safeParse({
			...base,
			ssl_ca: 'PEM',
			ssl_ca_path: 'ca.pem'
		});
		expect(result.success).toBe(false);
	});
});

describe('resolveSqlServerCredentials', () => {
	it('reads ssl_ca_path relative to cwd', async () => {
		const dir = await mkdtemp(path.join(tmpdir(), 'sqlserver-ca-'));
		await writeFile(path.join(dir, 'ca.pem'), 'PEM-CONTENT');
		const config = sqlserverConnectionSchema.parse({ ...base, ssl_ca_path: 'ca.pem' });

		const creds = await resolveSqlServerCredentials(config, { cwd: dir });

		expect(creds.ca).toBe('PEM-CONTENT');
		expect(creds.trustServerCertificate).toBe(false);
	});

	it('names the file when the CA path is unreadable', async () => {
		const config = sqlserverConnectionSchema.parse({ ...base, ssl_ca_path: 'missing.pem' });
		await expect(resolveSqlServerCredentials(config, { cwd: tmpdir() })).rejects.toThrow(
			'missing.pem'
		);
	});
});
