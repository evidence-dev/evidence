import type { z } from 'zod/v4';
import {
	snowflakeBase,
	snowflakeConnectionSchema,
	type SnowflakeConnection
} from './snowflake/connection-schema';
import {
	bigqueryBase,
	bigqueryConnectionSchema,
	type BigQueryConnection
} from './bigquery/connection-schema';
import {
	fabricBase,
	fabricConnectionSchema,
	type FabricConnection
} from './fabric/connection-schema';
import {
	clickhouseBase,
	clickhouseConnectionSchema,
	type ClickHouseConnection
} from './clickhouse/connection-schema';
import {
	databricksBase,
	databricksConnectionSchema,
	type DatabricksConnection
} from './databricks/connection-schema';
import {
	postgresBase,
	postgresConnectionSchema,
	type PostgresConnection
} from './postgres/connection-schema';
import { cubeBase, cubeConnectionSchema, type CubeConnection } from './cube/connection-schema';
import {
	motherduckBase,
	motherduckConnectionSchema,
	type MotherDuckConnection
} from './motherduck/connection-schema';

export type FieldCategory = 'credential' | 'context' | 'visibility' | 'rls';

export type ConnectionFieldMeta = {
	label: string;
	description: string;
	category: FieldCategory;
	/** Yaml key for this field. Defaults to the zod field name; only set when it differs. */
	yamlKey?: string;
	/** Stored in the Studio secret table rather than in org-settings JSON. */
	secret?: boolean;
	/** Only meaningful in connection.yaml — Studio never persists/edits this. */
	cliOnly?: boolean;
	/** Only meaningful in Studio — connection.yaml has no equivalent (yet). */
	studioOnly?: boolean;
	/** CLI resolves the value as a filesystem path relative to connection.yaml's dir. */
	fileRef?: { resolveRelativeTo: 'cwd' };
	/** Exactly one field per group must be provided. Enforced by per-schema .check(). */
	authGroup?: string;
};

declare module 'zod/v4' {
	interface GlobalMeta extends Partial<ConnectionFieldMeta> {}
}

export function getFieldMeta(field: z.ZodType): ConnectionFieldMeta | undefined {
	const m = field.meta();
	if (!m || typeof m !== 'object' || !('label' in m)) return undefined;
	return m as ConnectionFieldMeta;
}

export function fieldsByAuthGroup(shape: Record<string, z.ZodType>): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const [key, field] of Object.entries(shape)) {
		const m = getFieldMeta(field);
		if (m?.authGroup) (out[m.authGroup] ||= []).push(key);
	}
	return out;
}

/**
 * Cross-field check for auth-group oneOf semantics: for each authGroup defined
 * in the shape's metadata, exactly one field must be provided. Error messages
 * reference the user-facing yaml keys, not the zod field names (which are
 * identical for most fields, but a few — like `environments` — differ).
 */
export function authGroupOneOfCheck<S extends z.ZodObject>(schema: S): z.core.CheckFn<z.infer<S>> {
	const shape = schema.shape as Record<string, z.ZodType>;
	const groups = fieldsByAuthGroup(shape);
	const yamlKeyFor = (k: string) => getFieldMeta(shape[k])?.yamlKey ?? k;
	return (ctx) => {
		const v = ctx.value as Record<string, unknown>;
		for (const [, keys] of Object.entries(groups)) {
			const provided = keys.filter((k) => v[k] !== undefined && v[k] !== '');
			const yamlKeys = keys.map(yamlKeyFor);
			if (provided.length === 0) {
				ctx.issues.push({
					code: 'custom',
					message: `Provide one of: ${yamlKeys.join(', ')}.`,
					path: [],
					input: ctx.value
				});
			} else if (provided.length > 1) {
				ctx.issues.push({
					code: 'custom',
					message: `Provide only one of: ${yamlKeys.join(', ')}. Got: ${provided.map(yamlKeyFor).join(', ')}.`,
					path: [],
					input: ctx.value
				});
			}
		}
	};
}

export {
	snowflakeBase,
	snowflakeConnectionSchema,
	bigqueryBase,
	bigqueryConnectionSchema,
	fabricBase,
	fabricConnectionSchema,
	clickhouseBase,
	clickhouseConnectionSchema,
	databricksBase,
	databricksConnectionSchema,
	postgresBase,
	postgresConnectionSchema,
	cubeBase,
	cubeConnectionSchema,
	motherduckBase,
	motherduckConnectionSchema
};
export type {
	SnowflakeConnection,
	BigQueryConnection,
	FabricConnection,
	ClickHouseConnection,
	DatabricksConnection,
	PostgresConnection,
	CubeConnection,
	MotherDuckConnection
};

export const CONNECTION_TYPES = [
	'snowflake',
	'bigquery',
	'fabric',
	'clickhouse',
	'databricks',
	'postgres',
	'cube',
	'motherduck'
] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export type Connection =
	| SnowflakeConnection
	| BigQueryConnection
	| FabricConnection
	| ClickHouseConnection
	| DatabricksConnection
	| PostgresConnection
	| CubeConnection
	| MotherDuckConnection;

const schemasByType = {
	snowflake: snowflakeConnectionSchema,
	bigquery: bigqueryConnectionSchema,
	fabric: fabricConnectionSchema,
	clickhouse: clickhouseConnectionSchema,
	databricks: databricksConnectionSchema,
	postgres: postgresConnectionSchema,
	cube: cubeConnectionSchema,
	motherduck: motherduckConnectionSchema
} as const;

export function getConnectionSchema(type: ConnectionType): z.ZodType {
	return schemasByType[type];
}
