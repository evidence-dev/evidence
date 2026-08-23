import type { Connection } from './types';
import { getConnectionRegistry } from './context';
import { getInlineQueriesContext } from '../user-components/common/inline-queries';
import { connectionForReferenceString } from '../user-components/common/connection-for-attributes';

/**
 * The connection a direct-query component (charts, inputs — anything without a Model) should run
 * against, given its `data`/reference value. Resolves the reference's connection prefix / declared
 * connection against the registry; an unqualified reference uses the default. Dormant until
 * connection names are registered — with none, `connectionForReferenceString` returns undefined and
 * this is exactly `getDefaultConnection()`.
 */
export function connectionForData(reference: string | undefined): Connection {
	const registry = getConnectionRegistry();
	const inlineQueries = getInlineQueriesContext();
	const target = reference ? connectionForReferenceString(reference, inlineQueries) : undefined;
	return registry.get(target);
}
