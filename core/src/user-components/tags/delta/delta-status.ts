export type DeltaStatus = 'positive' | 'negative' | 'neutral';

/**
 * Whether a delta reads as up, down or flat. Values inside `neutralRange` ([min, max], null for
 * unbounded) are neutral. Shared by the delta component and the table Excel export.
 */
export function getDeltaStatus(
	value: unknown,
	neutralRange: readonly (number | null)[] = [0, 0]
): DeltaStatus {
	if (typeof value !== 'number') return 'neutral';
	const neutralMin = neutralRange[0] ?? -Infinity;
	const neutralMax = neutralRange[1] ?? Infinity;
	if (value > neutralMax) return 'positive';
	if (value < neutralMin) return 'negative';
	return 'neutral';
}
