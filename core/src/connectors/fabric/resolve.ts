import type { FabricCredentials } from './credentials';
import type { FabricConnection } from './connection-schema';

// Config → execution layer: assert clientSecret and narrow to the credential shape.
export function resolveFabricCredentials(config: FabricConnection): FabricCredentials {
	if (!config.clientSecret) {
		// The schema's auth-group check should have caught this — defensive.
		throw new Error('Fabric credentials are missing clientSecret');
	}
	return {
		server: config.server,
		database: config.database,
		tenantId: config.tenantId,
		clientId: config.clientId,
		clientSecret: config.clientSecret,
		defaultSchema: config.defaultSchema,
		schemas: config.schemas
	};
}
