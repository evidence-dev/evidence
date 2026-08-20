import { getContext, setContext } from 'svelte';
import type { DimensionGridFilter } from './DimensionGridFilter.svelte';

const DIMENSION_GRID_CONTEXT_KEY = Symbol('DIMENSION_GRID_CONTEXT');

export interface DimensionGridContext {
	filter: DimensionGridFilter | undefined;
	multiple: boolean;
	fmt?: string;
	metricLabel?: string;
}

export function setDimensionGridContext(context: DimensionGridContext): void {
	setContext(DIMENSION_GRID_CONTEXT_KEY, context);
}

export function getDimensionGridContext(): DimensionGridContext {
	const context = getContext<DimensionGridContext | undefined>(DIMENSION_GRID_CONTEXT_KEY);
	if (!context) {
		throw new Error('DimensionGrid context not found');
	}
	return context;
}
