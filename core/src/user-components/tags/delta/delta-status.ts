export type DeltaStatus = 'positive' | 'negative' | 'neutral';

/** `neutralRange` is inclusive; a null bound is unbounded. */
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
