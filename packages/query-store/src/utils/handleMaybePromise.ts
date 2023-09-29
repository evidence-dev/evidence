import type { MaybePromise } from '../types';

export const handleMaybePromise = <T, Returns>(
	resolvedFunction: (_v: T) => MaybePromise<Returns>,
	execFunction: () => MaybePromise<T>,
	errorHandler?: (e: Error | unknown) => MaybePromise<Returns>
): MaybePromise<Returns> => {
	try {
		const v = execFunction()
		if (v instanceof Promise)
			return v.then(resolvedFunction).catch((e) => {
				if (errorHandler) return errorHandler(e);
				else throw e;
			});
		return resolvedFunction(v);
	} catch (e) {
		if (errorHandler) return errorHandler(e);
		else throw e;
	}
};
