import { z } from 'zod/v4';
import { authGroupOneOfCheck, type ConnectionFieldMeta } from '../connection-schema';
import { notTemplatePlaceholder, PLACEHOLDER_MESSAGE } from '../connection-placeholder';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

const keyfileJsonShape = z.object({
	client_email: z.string().min(1),
	private_key: z.string().min(1),
	project_id: z.string().optional()
}).loose();

export const bigqueryBase = z.object({
	type: z.literal('bigquery'),

	project: z.string().min(1).refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE).meta(
		meta({
			label: 'Project ID',
			description: 'GCP project that owns the BigQuery datasets you want to query.',
			category: 'credential'
		})
	),

	keyfile_json: keyfileJsonShape.optional().meta(
		meta({
			label: 'Service account key (JSON)',
			description: 'Inline service-account key JSON.',
			category: 'credential',
			secret: true,
			authGroup: 'bigquery-auth'
		})
	),

	keyfile: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Service account key path',
				description: 'Path to a service-account key JSON file, resolved relative to connection.yaml.',
				category: 'credential',
				cliOnly: true,
				fileRef: { resolveRelativeTo: 'cwd' },
				authGroup: 'bigquery-auth'
			})
		),

	location: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Location',
				description: 'Default query location (e.g. US, EU, us-central1).',
				category: 'context'
			})
		),

	dataset: z
		.string()
		.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
		.optional()
		.meta(
			meta({
				label: 'Default dataset',
				description: 'Dataset used when queries reference unqualified table names.',
				category: 'context'
			})
		),

	datasets: z
		.array(z.string().min(1).refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE))
		.min(1)
		.meta(
			meta({
				label: 'Datasets',
				description: 'Allowlist of datasets exposed to the editor and schema browser.',
				category: 'visibility'
			})
		),

	roles: z
		.array(
			z.object({
				name: z.string().min(1),
				serviceAccountEmail: z.email()
			})
		)
		.default([])
		.meta(
			meta({
				label: 'Impersonation roles',
				description:
					'Service accounts the primary SA can impersonate for RLS. Each must have iam.serviceAccountTokenCreator granted to the primary SA.',
				category: 'rls'
			})
		)
});

export const bigqueryConnectionSchema = bigqueryBase.check(authGroupOneOfCheck(bigqueryBase));

export type BigQueryConnection = z.infer<typeof bigqueryConnectionSchema>;
export type KeyfileJson = z.infer<typeof keyfileJsonShape>;
