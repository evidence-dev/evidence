import { z } from 'zod/v4';
import type { ConnectionFieldMeta } from '../connection-schema';
import { notTemplatePlaceholder, PLACEHOLDER_MESSAGE } from '../connection-placeholder';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

/**
 * The region picks the Athena/STS endpoint hostname, so it must be a real AWS
 * region code — an SSRF guard against steering requests at an arbitrary host.
 */
export const AWS_REGION_PATTERN = /^[a-z]{2}(-gov|-iso[a-z]*)?-[a-z]+-\d{1,2}$/;

export const IAM_ROLE_ARN_PATTERN = /^arn:aws[a-z-]*:iam::\d{12}:role\/[\w+=,.@/-]+$/;

const roleArn = z
	.string()
	.trim()
	.regex(
		IAM_ROLE_ARN_PATTERN,
		'should be an IAM role ARN, e.g. arn:aws:iam::123456789012:role/evidence'
	);

const workGroup = z
	.string()
	.trim()
	.regex(/^[a-zA-Z0-9._-]{1,128}$/, 'should be an Athena workgroup name');

/**
 * Amazon Athena direct connector. Keys follow dbt-athena's profile shape.
 * Auth is an IAM access key (Studio) or the AWS default credential chain / a
 * named profile (CLI), optionally assuming `role_arn`. Per-user access control
 * assumes a different role per Evidence user (see `roles`), letting Lake
 * Formation enforce row/column filters per role.
 */
export const athenaBase = z.object({
	type: z.literal('athena'),

	region_name: z
		.string()
		.trim()
		.regex(AWS_REGION_PATTERN, 'should be an AWS region code, e.g. us-east-1')
		.meta(
			meta({
				label: 'Region',
				description: 'AWS region of the Athena workgroup, e.g. us-east-1.',
				category: 'credential'
			})
		),

	aws_access_key_id: z
		.string()
		.trim()
		.min(1)
		.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
		.optional()
		.meta(
			meta({
				label: 'Access key ID',
				description:
					'IAM access key ID. When omitted, the CLI uses aws_profile_name or the AWS default credential chain.',
				category: 'credential'
			})
		),

	aws_secret_access_key: z
		.string()
		.min(1)
		.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
		.optional()
		.meta(
			meta({
				label: 'Secret access key',
				description: 'IAM secret access key paired with the access key ID.',
				category: 'credential',
				secret: true
			})
		),

	aws_session_token: z
		.string()
		.min(1)
		.optional()
		.meta(
			meta({
				label: 'Session token',
				description: 'Session token for temporary credentials.',
				category: 'credential',
				cliOnly: true
			})
		),

	aws_profile_name: z
		.string()
		.min(1)
		.optional()
		.meta(
			meta({
				label: 'AWS profile',
				description: 'Named profile from ~/.aws/config (including SSO profiles).',
				category: 'credential',
				cliOnly: true
			})
		),

	role_arn: roleArn.optional().meta(
		meta({
			label: 'Role ARN',
			description:
				'IAM role assumed for every query not covered by a per-user role. Lets the access key be an assume-only principal.',
			category: 'credential'
		})
	),

	external_id: z
		.string()
		.trim()
		.min(2)
		.max(1224)
		.optional()
		.meta(
			meta({
				label: 'External ID',
				description: 'External ID required by the role trust policies, if any.',
				category: 'credential'
			})
		),

	s3_staging_dir: z
		.string()
		.trim()
		.refine((s) => s.startsWith('s3://'), { message: 'should be an s3:// URI' })
		.optional()
		.meta(
			meta({
				label: 'S3 results location',
				description:
					'S3 URI for query results, e.g. s3://my-bucket/athena-results/. Optional when the workgroup enforces its own results location.',
				category: 'context'
			})
		),

	work_group: workGroup.default('primary').meta(
		meta({
			label: 'Workgroup',
			description: 'Athena workgroup queries run in.',
			category: 'context'
		})
	),

	database: z
		.string()
		.trim()
		.min(1)
		.default('awsdatacatalog')
		.meta(
			meta({
				label: 'Data catalog',
				description: 'Athena data catalog (awsdatacatalog for the Glue Data Catalog).',
				category: 'context'
			})
		),

	schema: z
		.string()
		.trim()
		.min(1)
		.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
		.meta(
			meta({
				label: 'Database',
				description: 'Glue database used when queries reference unqualified table names.',
				category: 'context'
			})
		),

	schemas: z
		.array(z.string().min(1))
		.default([])
		.meta(
			meta({
				label: 'Databases',
				description:
					'Allowlist of Glue databases exposed to the editor and schema browser. Defaults to the connection database when empty.',
				category: 'visibility'
			})
		),

	result_reuse_minutes: z
		.number()
		.int()
		.min(0)
		.max(10080)
		.default(60)
		.meta(
			meta({
				label: 'Result reuse (minutes)',
				description:
					"Reuse Athena's cached result for an identical query run within this many minutes. 0 disables reuse.",
				category: 'context'
			})
		),

	roles: z
		.array(
			z.object({
				name: z.string().trim().min(1),
				role_arn: roleArn,
				work_group: workGroup.optional()
			})
		)
		.default([])
		.meta(
			meta({
				label: 'Access roles',
				description:
					'Named IAM roles assumed per Evidence user for row/column-level access (e.g. Lake Formation filters). Each trust policy must allow the connection credentials to assume it.',
				category: 'rls'
			})
		)
});

export const athenaConnectionSchema = athenaBase.check((ctx) => {
	const v = ctx.value;
	if (Boolean(v.aws_access_key_id) !== Boolean(v.aws_secret_access_key)) {
		ctx.issues.push({
			code: 'custom',
			message: 'aws_access_key_id and aws_secret_access_key must be provided together.',
			path: ['aws_secret_access_key'],
			input: ctx.value
		});
	}
	if (v.aws_access_key_id && v.aws_profile_name) {
		ctx.issues.push({
			code: 'custom',
			message: 'Provide only one of aws_access_key_id or aws_profile_name.',
			path: ['aws_profile_name'],
			input: ctx.value
		});
	}
	const names = new Set<string>();
	for (const role of v.roles) {
		if (names.has(role.name)) {
			ctx.issues.push({
				code: 'custom',
				message: `Duplicate role name "${role.name}".`,
				path: ['roles'],
				input: ctx.value
			});
		}
		names.add(role.name);
	}
});

export type AthenaConnection = z.infer<typeof athenaConnectionSchema>;
export type AthenaRole = AthenaConnection['roles'][number];
