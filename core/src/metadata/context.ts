import { getContext, setContext } from 'svelte';
import { Metadata } from './Metadata.svelte';
import {
	getConnectionRegistry,
	setConnectionRegistry,
	createSingleConnectionRegistry,
	withCatalog
} from '../connection';

const METADATA_CONTEXT_KEY = Symbol('METADATA_CONTEXT');

export const setMetadataContext = (metadata: Metadata) => {
	setContext(METADATA_CONTEXT_KEY, metadata);
	// Attach the catalog to the connection; runs after `setQueryService`, so the registry exists.
	setConnectionRegistry(
		createSingleConnectionRegistry(withCatalog(getConnectionRegistry().default, metadata))
	);
};

export const getMetadataContext = (): Metadata => {
	const context = getContext<Metadata | undefined>(METADATA_CONTEXT_KEY);
	if (!context) {
		throw new Error('Organization metadata context not found');
	}
	return context;
};
