import { z } from 'zod/v4';
import { authGroupOneOfCheck, type ConnectionFieldMeta } from '../connection-schema';
import { notTemplatePlaceholder, PLACEHOLDER_MESSAGE } from '../connection-placeholder';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

export const COUPLER_IO_DEFAULT_API_HOST = 'https://api.coupler.io';
export const COUPLER_IO_DEFAULT_MAX_CONCURRENT_REQUESTS = 4;

// The API token is sent to this host, so only Coupler.io's own domain is
// allowed — blocks sending it to an arbitrary host via a crafted
// connection.yaml or key file.
export const COUPLER_IO_ORIGIN_RE = /^https:\/\/([a-z0-9-]+\.)*coupler\.io$/i;

// Dataset ids are UUIDs (GET /v1/workspaces/{id}/datasets lists them).
const DATASET_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const couplerIoOrigin = z
	.string()
	.min(1)
	.transform((s) => s.trim().replace(/\/+$/, ''))
	.refine((s) => COUPLER_IO_ORIGIN_RE.test(s), {
		message: 'should be an https:// origin on coupler.io with no path, e.g. https://api.coupler.io'
	});

/**
 * Coupler.io direct connector. Queries go over the Coupler.io Public API: each
 * statement runs (as DuckDB SQL) against the latest snapshot of exactly one
 * dataset. Datasets are exposed as tables — either an explicit alias → dataset
 * id map, or every queryable dataset in the workspace under a name derived
 * from the dataset name.
 */
export const couplerIoBase = z.object({
	type: z.literal('coupler-io'),

	token: z
		.string()
		.min(1)
		.optional()
		.meta(
			meta({
				label: 'API token',
				description:
					'Personal API token from the API access section of the Coupler.io user profile. Sent as a Bearer token.',
				category: 'credential',
				secret: true,
				authGroup: 'auth'
			})
		),

	keyfile: z
		.string()
		.min(1)
		.optional()
		.meta(
			meta({
				label: 'Key file path',
				description:
					'Path to a JSON file with the API token, resolved relative to connection.yaml: {"token": "...", "api_host": "..."} (api_host optional).',
				category: 'credential',
				cliOnly: true,
				fileRef: { resolveRelativeTo: 'cwd' },
				authGroup: 'auth'
			})
		),

	// YAML reads an unquoted id as a number; accept both.
	workspace_id: z
		.preprocess(
			(v) => (typeof v === 'number' ? String(v) : v),
			z
				.string()
				.trim()
				.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
				.regex(/^\d+$/, 'should be a numeric Coupler.io workspace id')
		)
		.meta(
			meta({
				label: 'Workspace ID',
				description: 'Coupler.io workspace that owns the datasets (GET /v1/workspaces lists them).',
				category: 'context'
			})
		),

	// No zod default: a key file may set it, so resolve.ts applies
	// connection.yaml → key file → production default.
	api_host: couplerIoOrigin.optional().meta(
		meta({
			label: 'API host',
			description:
				'Coupler.io Public API origin. Defaults to the key file value, then https://api.coupler.io.',
			category: 'context'
		})
	),

	max_concurrent_requests: z
		.number()
		.int()
		.min(1)
		.max(50)
		.default(COUPLER_IO_DEFAULT_MAX_CONCURRENT_REQUESTS)
		.meta(
			meta({
				label: 'Max concurrent requests',
				description:
					'How many Coupler.io API requests run at once (1–50); the rest wait in a queue. The API allows 100 requests per minute per organization.',
				category: 'context'
			})
		),

	datasets: z
		.record(
			z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, {
				message: 'table names must be simple identifiers (letters, digits, underscore)'
			}),
			z
				.string()
				.trim()
				.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
				.regex(DATASET_ID_RE, 'should be a Coupler.io dataset id (a UUID)')
		)
		.default({})
		.meta(
			meta({
				label: 'Datasets',
				description:
					'Table name → dataset id; table names are simple identifiers (letters, digits, underscore). When empty, every queryable dataset in the workspace is exposed under a name derived from the dataset name.',
				category: 'visibility'
			})
		)
});

// Exactly one of token / keyfile.
export const couplerIoConnectionSchema = couplerIoBase.check(authGroupOneOfCheck(couplerIoBase));

export type CouplerIoConnection = z.infer<typeof couplerIoConnectionSchema>;
