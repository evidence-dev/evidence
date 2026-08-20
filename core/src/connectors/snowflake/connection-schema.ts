import { z } from 'zod/v4';
import { authGroupOneOfCheck, type ConnectionFieldMeta } from '../connection-schema';
import { notTemplatePlaceholder, PLACEHOLDER_MESSAGE } from '../connection-placeholder';
import { ACCOUNT_LOCATOR_MESSAGE, isValidAccountLocator } from './account-locator';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

export const snowflakeBase = z.object({
	type: z.literal('snowflake'),

	account: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		.refine((s) => !/^https?:\/\//i.test(s), {
			message: 'should be the account locator, not a URL — remove the "https://" prefix.'
		})
		.refine((s) => !/\.snowflakecomputing\.com\/?$/i.test(s), {
			message:
				'should be the account locator, not a URL — remove the ".snowflakecomputing.com" suffix.'
		})
		.transform((s) => s.replace(/_/g, '-'))
		.refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE)
		// Runs last: only issues[0] surfaces, and `<account>` deserves the fill-it-in message.
		.refine(isValidAccountLocator, { message: ACCOUNT_LOCATOR_MESSAGE })
		.meta(
			meta({
				label: 'Account',
				description: 'Snowflake account identifier, e.g. xy12345.us-east-1.',
				category: 'credential'
			})
		),

	user: z.string().min(1).refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE).meta(
		meta({
			label: 'User',
			description: 'Snowflake login name.',
			category: 'credential'
		})
	),

	password: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Password',
				description: 'Password for password auth.',
				category: 'credential',
				secret: true,
				authGroup: 'snowflake-auth'
			})
		),

	private_key: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Private key (PEM)',
				description: 'PEM-encoded RSA private key for key-pair auth.',
				category: 'credential',
				secret: true,
				authGroup: 'snowflake-auth'
			})
		),

	private_key_path: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Private key path',
				description: 'Path to PEM-encoded RSA private key, resolved relative to connection.yaml.',
				category: 'credential',
				cliOnly: true,
				fileRef: { resolveRelativeTo: 'cwd' },
				authGroup: 'snowflake-auth'
			})
		),

	private_key_passphrase: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Private key passphrase',
				description: 'Passphrase for the private key, if it is encrypted.',
				category: 'credential',
				secret: true
			})
		),

	warehouse: z.string().min(1).refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE).meta(
		meta({
			label: 'Warehouse',
			description: 'Compute warehouse to use for queries.',
			category: 'context'
		})
	),

	database: z.string().min(1).refine(notTemplatePlaceholder, PLACEHOLDER_MESSAGE).meta(
		meta({
			label: 'Database',
			description: 'Default database.',
			category: 'context'
		})
	),

	role: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Role',
				description: 'Role applied per session.',
				category: 'context'
			})
		),

	environments: z
		.object({
			production: z.string().min(1),
			devSchemas: z.array(z.string()).default([])
		})
		.optional()
		.meta(
			meta({
				yamlKey: 'schema',
				label: 'Schemas',
				description:
					'Production schema, plus optional developer schemas that act as preview environments.',
				category: 'visibility'
			})
		),

	sessionVariableMappings: z
		.array(
			z.object({
				snowflakeVariable: z.string().min(1),
				evidenceVariable: z.enum(['user.email', 'user.id', 'user.name', 'organization.id'])
			})
		)
		.default([])
		.meta(
			meta({
				yamlKey: 'session_variables',
				label: 'Session variables',
				description:
					'Evidence identity → Snowflake session variable, ALTERed per query for RLS.',
				category: 'rls'
			})
		)
});

export const snowflakeConnectionSchema = snowflakeBase.check(authGroupOneOfCheck(snowflakeBase));

export type SnowflakeConnection = z.infer<typeof snowflakeConnectionSchema>;
