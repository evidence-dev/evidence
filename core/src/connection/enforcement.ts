import type { InlineQueries } from '../user-components/common/inline-queries';

// Error message for a reference to a connection the org doesn't have, else undefined. Stands down
// when no connection names are registered (CLI / pre-activation) so references pass through unchanged.
export function connectionErrorFor(
	target: string | undefined,
	inlineQueries: InlineQueries | undefined
): string | undefined {
	if (!target) return undefined;
	if (!inlineQueries || inlineQueries.connectionNames().length === 0) return undefined;
	if (inlineQueries.isConnectionName(target)) return undefined;
	return `Connection "${target}" does not exist`;
}
