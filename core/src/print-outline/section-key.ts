export type RepeatIteration = { id: string; value: unknown };

// JSON keeps number vs string values distinct; both sides read values from the same query rows.
export function encodeIterationChain(chain: readonly RepeatIteration[]): string {
	return chain
		.map(
			({ id, value }) => `${encodeURIComponent(id)}=${encodeURIComponent(JSON.stringify(value))}`
		)
		.join('&');
}

// Headings outside any repeat keep their bare heading id so previously saved selections stay valid.
export function headingSectionKey(headingId: string, chain: readonly RepeatIteration[]): string {
	return chain.length === 0 ? headingId : `${headingId}?${encodeIterationChain(chain)}`;
}

export function parseSectionKey(key: string): { headingId: string; chain: string | undefined } {
	const q = key.lastIndexOf('?');
	if (q === -1) return { headingId: key, chain: undefined };
	return { headingId: key.slice(0, q), chain: key.slice(q + 1) };
}
