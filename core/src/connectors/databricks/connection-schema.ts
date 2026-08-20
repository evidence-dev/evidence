import { z } from 'zod/v4';
import { authGroupOneOfCheck, type ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

/**
 * Genuine Databricks workspace hosts end in `.databricks.com` (AWS/GCP) or
 * `.azuredatabricks.net` (Azure). The host is the target of an outbound
 * connection, so this is an SSRF guard: without it an attacker who can set the
 * connection (or hit the test-connection endpoint) could point Evidence at an
 * internal host. Exported so the Studio test endpoint applies the same rule.
 */
export const DATABRICKS_HOST_PATTERN = /\.(databricks\.com|azuredatabricks\.net)$/i;

export function isDatabricksHost(host: string): boolean {
	return DATABRICKS_HOST_PATTERN.test(host.trim());
}

/**
 * A session-variable name is embedded into a `DECLARE VARIABLE` statement at
 * query time, so it must be a plain SQL identifier. Validated here (not just at
 * execution) so a bad name is rejected on save with a clear message instead of
 * silently breaking every subsequent query. The Studio executor imports this so
 * the schema and the runtime guard can't drift.
 */
export const DATABRICKS_SESSION_VAR_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const databricksBase = z.object({
	type: z.literal('databricks'),

	host: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		// The driver builds the endpoint from host + http_path, so the host must be
		// a bare hostname, not a URL — a pasted `https://…` would double the scheme.
		.refine((s) => !/^https?:\/\//i.test(s), {
			message: 'should be the workspace hostname only, not a URL — remove the "https://" prefix.'
		})
		// Constrain to genuine Databricks workspace hosts (SSRF guard — see
		// isDatabricksHost).
		.refine(isDatabricksHost, {
			message:
				'must be a Databricks workspace host ending in .databricks.com or .azuredatabricks.net (e.g. dbc-xxxx.cloud.databricks.com).'
		})
		.meta(
			meta({
				label: 'Server hostname',
				description:
					'Databricks workspace hostname, e.g. dbc-a1b2c3d4-e5f6.cloud.databricks.com or adb-1234567890.1.azuredatabricks.net.',
				category: 'credential'
			})
		),

	http_path: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		.meta(
			meta({
				label: 'HTTP path',
				description:
					'SQL Warehouse HTTP path, e.g. /sql/1.0/warehouses/abc123def456 (Warehouse → Connection details).',
				category: 'credential'
			})
		),

	token: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Access token (PAT)',
				description: 'Databricks personal access token (dapi…). Mutually exclusive with OAuth.',
				category: 'credential',
				secret: true,
				authGroup: 'databricks-auth'
			})
		),

	client_id: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'OAuth client ID',
				description:
					'Service-principal (M2M) client ID for OAuth. Required when authenticating with a client secret.',
				category: 'credential'
			})
		),

	client_secret: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'OAuth client secret',
				description:
					'Service-principal (M2M) OAuth secret. Requires client ID; mutually exclusive with the access token.',
				category: 'credential',
				secret: true,
				authGroup: 'databricks-auth'
			})
		),

	catalog: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Catalog',
				description: 'Unity Catalog catalog to query.',
				category: 'context'
			})
		),

	schema: z
		.string()
		.min(1)
		.default('default')
		.meta(
			meta({
				label: 'Schema',
				description: 'Schema used when queries reference unqualified table names.',
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
					'Allowlist of schemas exposed to the editor and schema browser. Defaults to the connection schema when empty.',
				category: 'visibility'
			})
		),

	sessionVariableMappings: z
		.array(
			z.object({
				databricksVariable: z
					.string()
					.min(1)
					.regex(
						DATABRICKS_SESSION_VAR_PATTERN,
						'Session variable names must start with a letter or underscore and contain only letters, digits, and underscores.'
					),
				evidenceVariable: z.enum(['user.email', 'user.id', 'user.name', 'organization.id'])
			})
		)
		.default([])
		.meta(
			meta({
				yamlKey: 'session_variables',
				label: 'Session variables',
				description:
					'Evidence identity → Databricks SQL session variable, SET per query for RLS row filters.',
				category: 'rls'
			})
		)
});

export const databricksConnectionSchema = databricksBase
	.check(authGroupOneOfCheck(databricksBase))
	// OAuth needs both halves — the auth-group check only guarantees the secret half.
	.check((ctx) => {
		const v = ctx.value;
		if (v.client_secret && !v.client_id) {
			ctx.issues.push({
				code: 'custom',
				message: 'client_id is required when authenticating with an OAuth client secret.',
				path: ['client_id'],
				input: ctx.value
			});
		}
	});

export type DatabricksConnection = z.infer<typeof databricksConnectionSchema>;
