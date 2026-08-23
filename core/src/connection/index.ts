export type { Catalog, Connection, ConnectionRegistry } from './types';
export { createSingleConnectionRegistry } from './single-connection-registry';
export { createMultiConnectionRegistry, unknownConnection } from './multi-connection-registry';
export { connectionFromQueryService, withCatalog } from './query-service-connection';
export { connectionForData } from './connection-for-data';
export { connectionErrorFor } from './enforcement';
export {
	setConnectionRegistry,
	getConnectionRegistry,
	getConnectionRegistryOptional,
	getDefaultConnection
} from './context';
