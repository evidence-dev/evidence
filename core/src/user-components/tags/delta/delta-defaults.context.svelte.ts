import { getContext, setContext } from 'svelte';

export const DELTA_DEFAULTS_CONTEXT_KEY = Symbol('DELTA_DEFAULTS_CONTEXT');

export interface DeltaDefaults {
	downIsGood?: boolean;
}

export function setDeltaDefaultsContext(defaults: DeltaDefaults | (() => DeltaDefaults)) {
	setContext(DELTA_DEFAULTS_CONTEXT_KEY, defaults);
}

export function getDeltaDefaultsContext(): DeltaDefaults | undefined {
	const context = getContext<DeltaDefaults | (() => DeltaDefaults) | undefined>(
		DELTA_DEFAULTS_CONTEXT_KEY
	);
	if (!context) return undefined;
	if (typeof context === 'function') {
		return context();
	}
	return context;
}
