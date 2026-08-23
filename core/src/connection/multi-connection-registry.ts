import type { Connection, ConnectionRegistry } from './types';
import { defaultDialect } from '../sql-dialect';

// Stand-in for a nonexistent connection: `query` errors instead of hitting a warehouse, so a typo
// surfaces as an error rather than silently running against the default.
export function unknownConnection(id: string): Connection {
	const message = `Connection "${id}" does not exist`;
	return {
		id,
		type: 'unknown',
		dialect: defaultDialect,
		query: async () => ({ rows: [], columns: [], error: message })
	};
}

// Registry over N connections keyed by slug. Unknown id → `unknownConnection` (NOT the default), so a
// mistyped connection can't quietly query the wrong warehouse; an omitted id → default.
export function createMultiConnectionRegistry(
	connections: readonly Connection[],
	defaultId: string
): ConnectionRegistry {
	if (connections.length === 0) {
		throw new Error('createMultiConnectionRegistry requires at least one connection');
	}
	const byId = new Map(connections.map((c) => [c.id, c]));
	const fallback = byId.get(defaultId) ?? connections[0];
	return {
		default: fallback,
		all: connections,
		get(id?: string): Connection {
			if (id === undefined) return fallback;
			return byId.get(id) ?? unknownConnection(id);
		}
	};
}
