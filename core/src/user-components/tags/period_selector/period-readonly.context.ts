import { getContext, setContext } from 'svelte';

const KEY = Symbol('PERIOD_READONLY');

/** Static renders that aren't print (e.g. component screenshots) show the period as a plain label. */
export const setPeriodReadonlyContext = (value: boolean) => setContext(KEY, value);

export const getPeriodReadonlyContext = (): boolean => getContext<boolean>(KEY) ?? false;
