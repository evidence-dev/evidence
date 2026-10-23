import { z } from 'zod/v4';
import type { ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

/**
 * SQL Server direct connector (SQL Server 2017+, Azure SQL Database, Azure SQL
 * Managed Instance) with SQL-login auth. Keys follow the dbt-sqlserver profile.
 */
export const sqlserverBase = z.object({
	type: z.literal('sqlserver'),

	server: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		// We connect from server + port, so a pasted connection string or URL would be
		// treated as a literal hostname.
		.refine((s) => !/^[a-z]+:\/\//i.test(s) && !s.includes(';'), {
			message:
				'should be the hostname only, not a connection string or URL — fill in the individual fields instead.'
		})
		.meta(
			meta({
				label: 'Server',
				description:
					'SQL Server hostname, e.g. sql.example.com or myserver.database.windows.net. For a named instance, use the instance port rather than host\\instance.',
				category: 'credential'
			})
		),

	port: z
		.number()
		.int()
		.min(1)
		.max(65535)
		.default(1433)
		.meta(
			meta({
				label: 'Port',
				description: 'TDS port.',
				category: 'credential'
			})
		),

	user: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'User',
				description: 'SQL login to connect as.',
				category: 'credential'
			})
		),

	password: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Password',
				description: 'Password for the SQL login.',
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

	encrypt: z
		.boolean()
		.default(true)
		.meta(
			meta({
				label: 'Encrypt',
				description: 'Encrypt the connection with TLS. Required by Azure SQL.',
				category: 'credential'
			})
		),

	trust_cert: z
		.boolean()
		.default(false)
		.meta(
			meta({
				label: 'Trust server certificate',
				description:
					'Skip server certificate validation. Leaves the connection open to an active man-in-the-middle — prefer supplying your CA in ssl_ca for servers with a self-signed or internal-CA certificate.',
				category: 'credential'
			})
		),

	// Inline PEM (Studio stores it as a secret) or a path resolved relative to
	// connection.yaml (CLI); resolve.ts reads whichever is present.
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

	schema: z
		.string()
		.min(1)
		.default('dbo')
		.meta(
			meta({
				label: 'Default schema',
				description:
					"Schema the CLI uses to qualify bare table names (e.g. in `evidence describe`). T-SQL can't switch schema per session, so unqualified names in queries resolve against the login's default schema — set it with ALTER USER … WITH DEFAULT_SCHEMA.",
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
					'Allowlist of schemas exposed to the editor and schema browser. Empty exposes every schema the login can see.',
				category: 'visibility'
			})
		),

	sessionContextMappings: z
		.array(
			z.object({
				// Must match the executor's key check, which embeds the key in a T-SQL literal.
				contextKey: z
					.string()
					.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
						message:
							'Use a letter or underscore first, followed by letters, numbers, or underscores.'
					}),
				evidenceVariable: z.enum(['user.email', 'user.id', 'user.name', 'organization.id'])
			})
		)
		.default([])
		.meta(
			meta({
				yamlKey: 'session_context',
				label: 'Session context',
				description:
					'Evidence identity → SQL Server SESSION_CONTEXT key, set per query for row-level security.',
				category: 'rls'
			})
		)
});

export const sqlserverConnectionSchema = sqlserverBase.check((ctx) => {
	const v = ctx.value;
	if (v.ssl_ca && v.ssl_ca_path) {
		ctx.issues.push({
			code: 'custom',
			message: 'Provide only one of ssl_ca or ssl_ca_path, not both.',
			path: ['ssl_ca_path'],
			input: ctx.value
		});
	}
});

export type SqlServerConnection = z.infer<typeof sqlserverConnectionSchema>;
