import { getContext, setContext } from 'svelte';
import type { Connection, ConnectionRegistry } from './types';

const CONNECTION_REGISTRY_KEY = Symbol('CONNECTION_REGISTRY');

export function setConnectionRegistry(registry: ConnectionRegistry): void {
	setContext(CONNECTION_REGISTRY_KEY, registry);
}

export function getConnectionRegistry(): ConnectionRegistry {
	const registry = getContext<ConnectionRegistry | undefined>(CONNECTION_REGISTRY_KEY);
	if (!registry) {
		throw new Error('ConnectionRegistry context not set!');
	}
	return registry;
}

/** Convenience accessor for the sole/default connection. */
export function getDefaultConnection(): Connection {
	return getConnectionRegistry().default;
}
