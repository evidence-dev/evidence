/**
 * Loads + validates connection.yaml from the project root.
 *
 * Schema mirrors dbt's per-warehouse adapter shape (single target,
 * project-local) so dbt users can copy-paste with minimal changes. The
 * shape itself lives in @evidence/core/connectors/connection-schema; this file is
 * just: yaml → schema.parse → resolve to execution-layer credentials.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import type { z } from 'zod/v4';
import {
	CONNECTION_TYPES,
	bigqueryConnectionSchema,
	clickhouseConnectionSchema,
	databricksConnectionSchema,
	fabricConnectionSchema,
	getFieldMeta,
	postgresConnectionSchema,
	cubeConnectionSchema,
	motherduckConnectionSchema,
	snowflakeConnectionSchema
} from '@evidence/core/connectors/connection-schema';
import { resolveSnowflakeCredentials } from '@evidence/core/connectors/snowflake/resolve';
import { resolveBigQueryCredentials } from '@evidence/core/connectors/bigquery/resolve';
import { resolveClickHouseCredentials } from '@evidence/core/connectors/clickhouse/resolve';
import { resolveFabricCredentials } from '@evidence/core/connectors/fabric/resolve';
import { resolveDatabricksCredentials } from '@evidence/core/connectors/databricks/resolve';
import { resolvePostgresCredentials } from '@evidence/core/connectors/postgres/resolve';
import { resolveCubeCredentials } from '@evidence/core/connectors/cube/resolve';
import { resolveMotherduckCredentials } from '@evidence/core/connectors/motherduck/resolve';
import type { ConnectionConfig } from './types';

const CONFIG_FILENAME = 'connection.yaml';

// `${VAR}` in connection.yaml resolves from the process environment — secrets
// can live in the platform's env/secret store instead of the gitignored file.
// Interpolation runs AFTER yaml.parse on parsed string values, so a secret
// containing YAML-significant text (#, ": ", quotes, newlines) passes through
// verbatim instead of reshaping the document. A literal `${` in a non-env-var
// name position is left untouched.
const ENV_PATTERN = /\$\{([A-Z][A-Z0-9_]*)\}/g;

function interpolateValue(value: unknown): unknown {
	if (typeof value === 'string') {
		return value.replace(ENV_PATTERN, (match, name: string) => {
			const envValue = process.env[name];
			if (envValue === undefined) {
				throw new Error(
					`${CONFIG_FILENAME}: ${match} references unset environment variable ${name}`
				);
			}
			return envValue;
		});
	}
	if (Array.isArray(value)) return value.map(interpolateValue);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, interpolateValue(v)])
		);
	}
	return value;
}

export async function loadConnectionConfig(cwd: string): Promise<ConnectionConfig | null> {
	const configPath = path.join(cwd, CONFIG_FILENAME);

	let raw: string;
	try {
		raw = await readFile(configPath, 'utf-8');
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw new Error(`Failed to read ${CONFIG_FILENAME}: ${(e as Error).message}`);
	}

	let parsed: unknown;
	try {
		parsed = interpolateValue(yaml.load(raw));
	} catch (e) {
		if (e instanceof Error && e.message.startsWith(CONFIG_FILENAME)) throw e;
		throw new Error(`Failed to parse ${CONFIG_FILENAME}: ${(e as Error).message}`);
	}

	if (!parsed || typeof parsed !== 'object') {
		throw new Error(`${CONFIG_FILENAME}: expected a YAML object at the top level`);
	}
	const obj = { ...(parsed as Record<string, unknown>) };

	if (obj.type === 'snowflake') {
		// Yaml uses `schema:` (singular, legacy bare string OR new object form);
		// schema field is `environments` internally.
		if ('schema' in obj) {
			const v = obj.schema;
			obj.environments = typeof v === 'string' ? { production: v, devSchemas: [] } : v;
			delete obj.schema;
		}
		// Yaml uses `session_variables:`; schema field is camelCase internally.
		if ('session_variables' in obj) {
			obj.sessionVariableMappings = obj.session_variables;
			delete obj.session_variables;
		}
		const data = parseOrThrow(snowflakeConnectionSchema, obj);
		const credentials = await resolveSnowflakeCredentials(data, { cwd });
		return { type: 'snowflake', ...credentials };
	}

	if (obj.type === 'bigquery') {
		// keyfile_json can be a JSON string or a structured object.
		if (typeof obj.keyfile_json === 'string') {
			try {
				obj.keyfile_json = JSON.parse(obj.keyfile_json);
			} catch (e) {
				throw new Error(
					`${CONFIG_FILENAME}: keyfile_json string is not valid JSON: ${(e as Error).message}`
				);
			}
		}
		const data = parseOrThrow(bigqueryConnectionSchema, obj);
		const credentials = await resolveBigQueryCredentials(data, { cwd });
		return { type: 'bigquery', ...credentials };
	}

	if (obj.type === 'clickhouse') {
		const data = parseOrThrow(clickhouseConnectionSchema, obj);
		return { type: 'clickhouse', ...resolveClickHouseCredentials(data) };
	}

	if (obj.type === 'fabric') {
		// Rename yaml `session_context:` → camelCase so a Studio-style config still validates.
		if ('session_context' in obj) {
			obj.sessionContextMappings = obj.session_context;
			delete obj.session_context;
		}
		const data = parseOrThrow(fabricConnectionSchema, obj);
		const credentials = resolveFabricCredentials(data);
		return { type: 'fabric', ...credentials };
	}

	if (obj.type === 'databricks') {
		// Rename yaml `session_variables:` → camelCase so a Studio-style config still validates.
		if ('session_variables' in obj) {
			obj.sessionVariableMappings = obj.session_variables;
			delete obj.session_variables;
		}
		const data = parseOrThrow(databricksConnectionSchema, obj);
		const credentials = resolveDatabricksCredentials(data);
		return { type: 'databricks', ...credentials };
	}

	if (obj.type === 'postgres') {
		const data = parseOrThrow(postgresConnectionSchema, obj);
		const credentials = await resolvePostgresCredentials(data, { cwd });
		return { type: 'postgres', ...credentials };
	}

	if (obj.type === 'cube') {
		const data = parseOrThrow(cubeConnectionSchema, obj);
		const credentials = await resolveCubeCredentials(data, { cwd });
		return { type: 'cube', ...credentials };
	}

	if (obj.type === 'motherduck') {
		const data = parseOrThrow(motherduckConnectionSchema, obj);
		const credentials = await resolveMotherduckCredentials(data, { cwd });
		return { type: 'motherduck', ...credentials };
	}

	throw new Error(
		`${CONFIG_FILENAME}: unsupported type ${JSON.stringify(obj.type)}. Supported: ${CONNECTION_TYPES.join(', ')}.`
	);
}

function parseOrThrow<S extends z.ZodObject>(schema: S, data: unknown): z.infer<S> {
	const result = schema.safeParse(data);
	if (result.success) return result.data;
	const issue = result.error.issues[0];
	if (!issue) throw new Error(`${CONFIG_FILENAME}: validation failed (no issue detail)`);
	const path = [...issue.path];
	// Translate the top-level segment to its yaml key if the field has one
	// (e.g. `environments` → `schema`), so error paths match what the user wrote.
	if (typeof path[0] === 'string') {
		const field = (schema.shape as Record<string, z.ZodType>)[path[0]];
		const yamlKey = field && getFieldMeta(field)?.yamlKey;
		if (yamlKey) path[0] = yamlKey;
	}
	const where = path.join('.');
	throw new Error(`${CONFIG_FILENAME}:${where ? ` ${where}:` : ''} ${issue.message}`);
}
