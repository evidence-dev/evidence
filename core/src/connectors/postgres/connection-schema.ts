import { z } from 'zod/v4';
import type { ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

/**
 * Generic Postgres direct connector. The base for every Postgres-wire flavour —
 * Amazon RDS / Aurora, Supabase, Neon, Timescale, CockroachDB, etc. — which reuse
 * this exact shape and differ only in form defaults (port, sslMode) and UI
 * metadata, not in structure.
 */
export const postgresBase = z.object({
	type: z.literal('postgres'),

	host: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		// We build the connection from host + port, so the host must be a bare
		// hostname, not a URL — a pasted `postgres://…` would otherwise be treated
		// as a literal hostname. Point users at the individual fields instead.
		.refine((s) => !/^[a-z]+:\/\//i.test(s), {
			message:
				'should be the hostname only, not a connection URL — remove the "postgres://" prefix and fill in the fields.'
		})
		.meta(
			meta({
				label: 'Host',
				description:
					'Postgres server hostname, e.g. db.example.com or mydb.abc123.us-east-1.rds.amazonaws.com.',
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
				description: 'Postgres port. Defaults to 5432; Supabase poolers use 6543.',
				category: 'credential'
			})
		),

	user: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'User',
				description: 'Postgres user to connect as.',
				category: 'credential'
			})
		),

	password: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Password',
				description: 'Password for the Postgres user.',
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
				description: 'Database to connect to.',
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
					'verify-full (default) = encrypt and verify the server certificate + hostname — the secure choice. verify-ca = verify the cert but not the hostname. require = encrypt WITHOUT verifying the cert (vulnerable to an active man-in-the-middle — avoid). disable = no TLS. For a private CA (e.g. Amazon RDS), keep verify-full and supply the CA bundle in ssl_ca.',
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
					'Schema used when queries reference unqualified table names (sets search_path).',
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
					'Allowlist of schemas exposed to the editor and schema browser. Defaults to just the default schema (the `schema` field) when empty; list additional schemas to include them.',
				category: 'visibility'
			})
		)
});

export const postgresConnectionSchema = postgresBase
	// An inline PEM and a file path for the same material are mutually exclusive —
	// providing both is ambiguous about which one wins.
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

export type PostgresConnection = z.infer<typeof postgresConnectionSchema>;
