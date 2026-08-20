import type { DatabricksConnection } from './connection-schema';
import type { DatabricksCredentials } from './credentials';

/**
 * Config layer → execution layer. Narrows the parsed connection.yaml to the
 * credential shape the driver needs, picking the auth method from whichever
 * secret is present. `schema` and `schemas` are always present post-parse
 * (schema defaults), so no fallbacks.
 */
export function resolveDatabricksCredentials(config: DatabricksConnection): DatabricksCredentials {
	const common = {
		host: config.host,
		httpPath: config.http_path,
		catalog: config.catalog,
		schema: config.schema,
		schemas: config.schemas
	};

	if (config.client_secret) {
		if (!config.client_id) {
			// The schema check should have caught this — defensive.
			throw new Error('Databricks OAuth credentials are missing client_id');
		}
		return {
			...common,
			authType: 'oauth',
			clientId: config.client_id,
			clientSecret: config.client_secret
		};
	}

	if (!config.token) {
		// The auth-group check should have caught this — defensive.
		throw new Error('Databricks credentials are missing token');
	}
	return { ...common, authType: 'token', token: config.token };
}
