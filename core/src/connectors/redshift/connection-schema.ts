import { z } from 'zod/v4';
import type { ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

/**
 * Amazon Redshift direct connector. Redshift speaks the Postgres wire protocol,
 * so the connection shape is the generic Postgres one (host/port/user/password/
 * database/sslmode/schema) with Redshift defaults — port 5439, verify-full TLS —
 * and matches dbt-redshift's password-auth profile. Auth is database user +
 * password only, the same capability the legacy Redshift ETL connector offered;
 * IAM / temporary-credential auth is deliberately out of scope here.
 */
export const redshiftBase = z.object({
	type: z.literal('redshift'),

	host: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		.refine((s) => !/^[a-z]+:\/\//i.test(s), {
			message:
				'should be the hostname only, not a connection URL — remove the "redshift://" prefix and fill in the fields.'
		})
		.meta(
			meta({
				label: 'Host',
				description:
					'Cluster or workgroup endpoint, e.g. my-cluster.abc123.us-east-1.redshift.amazonaws.com or my-workgroup.123456789012.us-east-1.redshift-serverless.amazonaws.com.',
				category: 'credential'
			})
		),

	port: z
		.number()
		.int()
		.min(1)
		.max(65535)
		.default(5439)
		.meta(
			meta({
				label: 'Port',
				description: 'Redshift port (Serverless workgroups also default to 5439).',
				category: 'credential'
			})
		),

	user: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'User',
				description: 'Redshift database user to connect as.',
				category: 'credential'
			})
		),

	password: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Password',
				description: 'Password for the Redshift database user.',
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
				description: 'Database to connect to (e.g. dev).',
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
					'verify-full (default) = encrypt and verify the server certificate + hostname — the secure choice; Redshift endpoints serve publicly trusted certificates so no CA bundle is needed. verify-ca = verify the cert but not the hostname. require = encrypt WITHOUT verifying the cert (vulnerable to an active man-in-the-middle — avoid). disable = no TLS (rejected by clusters with require_SSL on).',
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
					'Allowlist of schemas exposed to the editor and schema browser. Defaults to just the default schema (the `schema` field) when empty; list additional schemas (including Spectrum external schemas) to include them.',
				category: 'visibility'
			})
		)
});

export const redshiftConnectionSchema = redshiftBase
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

export type RedshiftConnection = z.infer<typeof redshiftConnectionSchema>;
