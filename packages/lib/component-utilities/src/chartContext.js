import { getContext, setContext } from 'svelte';
import { isStrictMode } from '@evidence-dev/sdk/utils';
const configKey = Symbol();
const propKey = Symbol();

export const strictBuild = isStrictMode();
export { configKey, propKey };

export const getConfigContext = () => getContext(configKey);
export const setConfigContext = (v) => setContext(configKey, v);

export const getPropContext = () => getContext(propKey);
export const setPropContext = (v) => setContext(propKey, v);
