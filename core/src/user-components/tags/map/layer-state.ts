export type MapLayerState = {
	added: boolean;
	data: readonly unknown[];
	variant?: unknown;
};

export type MapLayerAction = 'none' | 'replace' | 'remove';

function rowsEqual(previous: readonly unknown[], current: readonly unknown[]): boolean {
	if (previous === current) return true;
	if (previous.length !== current.length) return false;

	return previous.every((previousRow, index) => {
		const currentRow = current[index];
		if (Object.is(previousRow, currentRow)) return true;
		if (
			typeof previousRow !== 'object' ||
			previousRow === null ||
			typeof currentRow !== 'object' ||
			currentRow === null
		) {
			return false;
		}

		const previousRecord = previousRow as Record<string, unknown>;
		const currentRecord = currentRow as Record<string, unknown>;
		const previousKeys = Object.keys(previousRecord);
		const currentKeys = Object.keys(currentRecord);

		return (
			previousKeys.length === currentKeys.length &&
			previousKeys.every(
				(key) =>
					Object.prototype.hasOwnProperty.call(currentRecord, key) &&
					Object.is(previousRecord[key], currentRecord[key])
			)
		);
	});
}

export function transitionMapLayer(
	state: MapLayerState | undefined,
	data: readonly unknown[],
	variant?: unknown
): { action: MapLayerAction; state: MapLayerState } {
	const changed = !state || state.variant !== variant || !rowsEqual(state.data, data);
	let action: MapLayerAction = 'none';

	if (changed) {
		if (data.length > 0) action = 'replace';
		else if (state?.added) action = 'remove';
	}

	return {
		action,
		state: {
			added: action === 'replace' || (action === 'none' && state?.added === true),
			data,
			variant
		}
	};
}
