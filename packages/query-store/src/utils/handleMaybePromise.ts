import type { MaybePromise } from '../types';

export const handleMaybePromise = <T>(f: (_v: T) => MaybePromise<unknown>, v: MaybePromise<T>) => {
	if (v instanceof Promise) return v.then(f);
	return f(v);
};
