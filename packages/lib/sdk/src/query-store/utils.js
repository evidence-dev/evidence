/**
 * @template T
 * @template [Returns=void]
 * @param {(v: T, isPromise: boolean) => import("./types.js").MaybePromise<Returns>} handler
 * @param {import("./types.js").MaybePromise<T>} value
 * @param {(e: Error, isPromise: boolean) => Returns} [onError]
 */
export const resolveMaybePromise = (handler, value, onError) => {
	try {
		if (value instanceof Promise) {
			return value
				.then((v) => handler(v, true))
				.catch((e) => {
					const error = e instanceof Error ? e : new Error('Unknown Error', { cause: e });
					if (onError) return onError(error, true);
					throw error;
				});
		} else {
			return handler(value, false);
		}
	} catch (e) {
		const error = e instanceof Error ? e : new Error('Unknown Error', { cause: e });
		if (onError) return onError(error, false);
		else throw error;
	}
};
