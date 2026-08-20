import { z } from 'zod/v4';
import type { ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

// MotherDuck's default Postgres-wire endpoint (us-east-1). Region-specific —
// orgs whose database lives in another region override `host`.
export const MOTHERDUCK_DEFAULT_HOST = 'pg.us-east-1-aws.motherduck.com';

export const motherduckBase = z.object({
	type: z.literal('motherduck'),

	token: z
		.string()
		.min(1)
		.meta(
			meta({
				label: 'Service token',
				description:
					'MotherDuck access (service) token. Sent as the password when connecting to the MotherDuck Postgres endpoint.',
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
				description: 'MotherDuck database name to query.',
				category: 'context'
			})
		),

	host: z
		.string()
		.min(1)
		.default(MOTHERDUCK_DEFAULT_HOST)
		.meta(
			meta({
				label: 'Host',
				description:
					'MotherDuck Postgres endpoint host. Region-specific; the default targets us-east-1. Override for other regions (e.g. pg.eu-west-1-aws.motherduck.com).',
				category: 'context'
			})
		),

	schemas: z
		.array(z.string().min(1))
		.default([])
		.meta(
			meta({
				label: 'Schemas',
				description: 'Allowlist of schemas exposed to the editor and schema browser.',
				category: 'visibility'
			})
		)
});

// MotherDuck has a single credential (the service token), so there's no
// auth-group `oneOf` to enforce — unlike Snowflake/Fabric, the base schema is
// already the full connection schema.
export const motherduckConnectionSchema = motherduckBase;

export type MotherDuckConnection = z.infer<typeof motherduckConnectionSchema>;
