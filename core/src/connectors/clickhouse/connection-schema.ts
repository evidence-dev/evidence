import { z } from 'zod/v4';
import { authGroupOneOfCheck, type ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

export const clickhouseBase = z.object({
	type: z.literal('clickhouse'),

	host: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		// The client connects to the HTTP(S) interface and we build the URL from
		// host + port + secure — so the host must be a bare hostname, not a URL.
		// A pasted `https://…:8443` would otherwise double up the scheme/port.
		.refine((s) => !/^https?:\/\//i.test(s), {
			message: 'should be the hostname only, not a URL — remove the "https://" prefix.'
		})
		.meta(
			meta({
				label: 'Host',
				description:
					'ClickHouse HTTP(S) interface hostname, e.g. abc123.us-east-1.aws.clickhouse.cloud.',
				category: 'credential'
			})
		),

	port: z
		.number()
		.int()
		.min(1)
		.max(65535)
		.default(8443)
		.meta(
			meta({
				label: 'Port',
				description:
					'HTTP(S) interface port — 8443 for TLS (the ClickHouse Cloud default), 8123 for plain HTTP.',
				category: 'credential'
			})
		),

	secure: z
		.boolean()
		.default(true)
		.meta(
			meta({
				label: 'Use TLS',
				description:
					'Connect over HTTPS. Leave on for ClickHouse Cloud; turn off for a plain-HTTP self-hosted instance.',
				category: 'credential'
			})
		),

	username: z
		.string()
		.min(1)
		.default('default')
		.meta(
			meta({
				label: 'Username',
				description: 'ClickHouse user to connect as.',
				category: 'credential'
			})
		),

	password: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Password',
				description: 'Password for the ClickHouse user.',
				category: 'credential',
				secret: true,
				authGroup: 'clickhouse-auth'
			})
		),

	access_token: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Access token (JWT)',
				description:
					'JWT access token. Supported by ClickHouse Cloud only; mutually exclusive with password.',
				category: 'credential',
				secret: true,
				authGroup: 'clickhouse-auth'
			})
		),

	database: z
		.string()
		.min(1)
		.default('default')
		.meta(
			meta({
				label: 'Database',
				description: 'Default database for unqualified table references.',
				category: 'context'
			})
		),

	databases: z
		.array(z.string().min(1))
		.default([])
		.meta(
			meta({
				label: 'Databases',
				description:
					'Allowlist of databases exposed to the editor and schema browser. Defaults to the connection database when empty.',
				category: 'visibility'
			})
		)
});

export const clickhouseConnectionSchema = clickhouseBase.check(authGroupOneOfCheck(clickhouseBase));

export type ClickHouseConnection = z.infer<typeof clickhouseConnectionSchema>;
