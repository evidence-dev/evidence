import { getContext, setContext } from 'svelte';

const KEY = Symbol('SHOW_ERRORS');

export const setShowErrorsContext = (show: boolean) => setContext(KEY, show);

export const getShowErrorsContext = (): boolean => getContext<boolean | undefined>(KEY) ?? false;
