import { getContext, setContext } from 'svelte';

const ROW_CONTEXT_KEY = Symbol('ROW_CONTEXT');

export type RowContextArgs = {
	initialGapPx: number;
};

export class RowContext {
	// @ts-expect-error gap is initialized in the constructor
	gapPx: number = $state();

	constructor({ initialGapPx }: RowContextArgs) {
		this.gapPx = initialGapPx;
	}
}

export const createRowContext = (args: RowContextArgs): RowContext => {
	const context = new RowContext(args);
	setContext(ROW_CONTEXT_KEY, context);
	return context;
};

export const getRowContext = (): RowContext | undefined => {
	const context = getContext<RowContext | undefined>(ROW_CONTEXT_KEY);
	return context;
};
