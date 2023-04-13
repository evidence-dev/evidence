const configKey = Symbol();
const propKey = Symbol();

export const strictBuild = import.meta.env.VITE_BUILD_STRICT === 'true';
export { configKey, propKey };
