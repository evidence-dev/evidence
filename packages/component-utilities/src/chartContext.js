import { getContext, setContext } from 'svelte';

const configKey = Symbol();
const propKey = Symbol();

export const strictBuild = import.meta.env.VITE_BUILD_STRICT === 'true';
export { configKey, propKey };

export const getConfigContext = () => getContext(configKey);
export const setConfigContext = (v) => setContext(configKey, v);

export const getPropContext = () => getContext(propKey);
export const setPropContext = (v) => setContext(propKey, v);
