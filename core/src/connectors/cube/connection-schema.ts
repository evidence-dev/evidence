import { z } from 'zod/v4';
import type { ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

/**
 * Cube direct connector. Cube's SQL API speaks the Postgres wire protocol, so the
 * connection shape is identical to the generic Postgres connector — a BI tool
 * connects to Cube exactly as it would to Postgres. The difference lives in the
 * dialect (Cube implements a documented *subset* of Postgres functions) and in
 * schema introspection, not here. Field metadata is Cube-flavoured (SQL API host,
 * `CUBEJS_SQL_USER`, etc.) so the form reads correctly for Cube users.
 */
export const cubeBase = z.object({
	type: z.literal('cube'),

	host: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		.refine((s) => !/^[a-z]+:\/\//i.test(s), {
			message:
				'should be the hostname only, not a connection URL — remove the "postgres://" prefix and fill in the fields.'
		})
		.meta(
			meta({
				label: 'Host',
				description:
					'Cube SQL API host, e.g. your-deployment.aws-us-east-1.cubecloudapp.dev (Cube Cloud) or the host running Cube.',
				category: 'credential'
			})
		),

	port: z
		.number()
		.int()
		.min(1)
		.max(65535)
		.default(5432)
		.meta(
			meta({
				label: 'Port',
				description:
					'Cube SQL API port. Cube Cloud uses 5432; self-hosted Cube uses CUBEJS_PG_SQL_PORT (commonly 15432).',
				category: 'credential'
			})
		),

	user: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'User',
				description: 'Cube SQL API user (CUBEJS_SQL_USER).',
				category: 'credential'
			})
		),

	password: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Password',
				description: 'Cube SQL API password (CUBEJS_SQL_PASSWORD).',
				category: 'credential',
				secret: true
			})
		),

	database: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Database',
				description:
					'Database name from Cube’s SQL API connection details (self-hosted Cube accepts any value).',
				category: 'context'
			})
		),

	sslmode: z
		.enum(['disable', 'require', 'verify-ca', 'verify-full'])
		.default('verify-full')
		.meta(
			meta({
				label: 'SSL mode',
				description:
					'verify-full (default) = encrypt and verify the server certificate + hostname — the secure choice, and what Cube Cloud serves. verify-ca = verify the cert but not the hostname. require = encrypt WITHOUT verifying the cert (vulnerable to an active man-in-the-middle — avoid). disable = no TLS, for a local self-hosted Cube without SSL.',
				category: 'credential'
			})
		),

	// TLS material comes as either an inline PEM (Studio stores it as a secret) or
	// a filesystem path resolved relative to connection.yaml (CLI). resolve.ts
	// reads whichever is present; the *_path variants are cliOnly.
	ssl_ca: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'SSL CA certificate',
				description: 'PEM CA bundle used to verify the server certificate.',
				category: 'credential',
				secret: true
			})
		),

	ssl_ca_path: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'SSL CA certificate path',
				description: 'Path to a PEM CA bundle, resolved relative to connection.yaml.',
				category: 'credential',
				cliOnly: true,
				fileRef: { resolveRelativeTo: 'cwd' }
			})
		),

	ssl_cert: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'SSL client certificate',
				description: 'PEM client certificate for mutual TLS.',
				category: 'credential',
				secret: true
			})
		),

	ssl_cert_path: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'SSL client certificate path',
				description: 'Path to a PEM client certificate, resolved relative to connection.yaml.',
				category: 'credential',
				cliOnly: true,
				fileRef: { resolveRelativeTo: 'cwd' }
			})
		),

	ssl_key: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'SSL client key',
				description: 'PEM client private key for mutual TLS.',
				category: 'credential',
				secret: true
			})
		),

	ssl_key_path: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'SSL client key path',
				description: 'Path to a PEM client private key, resolved relative to connection.yaml.',
				category: 'credential',
				cliOnly: true,
				fileRef: { resolveRelativeTo: 'cwd' }
			})
		),

	schema: z
		.string()
		.min(1)
		.default('public')
		.meta(
			meta({
				label: 'Schema',
				description:
					'Schema used when queries reference unqualified names. Cube exposes cubes and views in the public schema.',
				category: 'context'
			})
		),

	schemas: z
		.array(z.string().min(1))
		.default([])
		.meta(
			meta({
				label: 'Schemas',
				description:
					'Allowlist of schemas exposed to the editor and schema browser. Defaults to just the default schema (the `schema` field) when empty.',
				category: 'visibility'
			})
		)
});

export const cubeConnectionSchema = cubeBase
	// An inline PEM and a file path for the same material are mutually exclusive.
	.check((ctx) => {
		const v = ctx.value;
		const pairs: [string, unknown, unknown][] = [
			['ssl_ca', v.ssl_ca, v.ssl_ca_path],
			['ssl_cert', v.ssl_cert, v.ssl_cert_path],
			['ssl_key', v.ssl_key, v.ssl_key_path]
		];
		for (const [name, inline, path] of pairs) {
			if (inline && path) {
				ctx.issues.push({
					code: 'custom',
					message: `Provide only one of ${name} or ${name}_path, not both.`,
					path: [`${name}_path`],
					input: ctx.value
				});
			}
		}
	});

export type CubeConnection = z.infer<typeof cubeConnectionSchema>;
