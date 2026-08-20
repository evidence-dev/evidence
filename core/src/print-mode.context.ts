import { getContext, setContext } from 'svelte';

const PRINT_MODE_CONTEXT_KEY = Symbol('PRINT_MODE');

export const setPrintModeContext = (value: boolean) => {
	setContext(PRINT_MODE_CONTEXT_KEY, value);
};

export const getPrintModeContext = (): boolean => {
	return getContext<boolean>(PRINT_MODE_CONTEXT_KEY) ?? false;
};
