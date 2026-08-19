export type { Connection, ConnectionRegistry } from './types';
export { createSingleConnectionRegistry } from './single-connection-registry';
export { connectionFromQueryService } from './query-service-connection';
export { setConnectionRegistry, getConnectionRegistry, getDefaultConnection } from './context';
