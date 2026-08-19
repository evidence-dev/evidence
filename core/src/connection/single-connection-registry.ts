import type { Connection, ConnectionRegistry } from './types';

// Registry-of-one: every lookup resolves to the sole connection (both the match and the default).
export function createSingleConnectionRegistry(connection: Connection): ConnectionRegistry {
	return {
		default: connection,
		all: [connection],
		get: () => connection
	};
}
