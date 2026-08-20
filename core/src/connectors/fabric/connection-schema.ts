import { z } from 'zod/v4';
import { authGroupOneOfCheck, type ConnectionFieldMeta } from '../connection-schema';

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

export const fabricBase = z.object({
	type: z.literal('fabric'),

	tenantId: z.string().min(1).meta(
		meta({
			label: 'Tenant ID',
			description: 'Azure Entra (Active Directory) tenant ID that owns the service principal.',
			category: 'credential'
		})
	),

	clientId: z.string().min(1).meta(
		meta({
			label: 'Client ID',
			description: 'Application (client) ID of the Entra service principal used to authenticate.',
			category: 'credential'
		})
	),

	clientSecret: z
		.string()
		.optional()
		.meta(
			meta({
				label: 'Client secret',
				description: 'Client secret for the service principal.',
				category: 'credential',
				secret: true,
				authGroup: 'fabric-auth'
			})
		),

	server: z
		.string()
		.min(1)
		.transform((s) => s.trim())
		.refine((s) => !/^https?:\/\//i.test(s), {
			message: 'should be the SQL endpoint host, not a URL — remove the "https://" prefix.'
		})
		// Constrain to genuine Fabric SQL endpoints (incl. sovereign clouds). The
		// server host is the target of an outbound TDS connection; without this an
		// attacker who can set org settings could point Evidence at internal hosts
		// (blind SSRF / port scan). Real endpoints are `*.fabric.microsoft.com`
		// (and the .us / .cn sovereign variants).
		.refine((s) => /\.fabric\.microsoft\.(com|us|cn)$/i.test(s), {
			message:
				'must be a Microsoft Fabric SQL endpoint host ending in .fabric.microsoft.com (e.g. xxxx.datawarehouse.fabric.microsoft.com).'
		})
		.meta(
			meta({
				label: 'SQL endpoint',
				description:
					'Fabric SQL connection string / endpoint host, e.g. xxxxxxxx.datawarehouse.fabric.microsoft.com.',
				category: 'credential'
			})
		),

	database: z.string().min(1).meta(
		meta({
			label: 'Database',
			description: 'Warehouse or Lakehouse SQL analytics endpoint name to query.',
			category: 'context'
		})
	),

	defaultSchema: z
		.string()
		.min(1)
		.default('dbo')
		.meta(
			meta({
				label: 'Default schema',
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
				description: 'Allowlist of schemas exposed to the editor and schema browser.',
				category: 'visibility'
			})
		),

	sessionContextMappings: z
		.array(
			z.object({
				fabricContextKey: z.string().min(1),
				evidenceVariable: z.enum(['user.email', 'user.id', 'user.name', 'organization.id'])
			})
		)
		.default([])
		.meta(
			meta({
				yamlKey: 'session_context',
				label: 'Session context',
				description: 'Evidence identity → Fabric SESSION_CONTEXT key, SET per query for RLS.',
				category: 'rls'
			})
		)
});

export const fabricConnectionSchema = fabricBase.check(authGroupOneOfCheck(fabricBase));

export type FabricConnection = z.infer<typeof fabricConnectionSchema>;
