/**
 * @template T
 * @template [Returns=void]
 * @param {(v: T, isPromise: boolean) => import("../types.js").MaybePromise<Returns>} handler
 * @param {import("../types.js").MaybePromise<T> | (() => import("../types.js").MaybePromise<T>)} value
 * @param {(e: Error, isPromise: boolean) => import("../types.js").MaybePromise<Returns>} [onError]
 */
export const resolveMaybePromise = (handler, value, onError) => {
	try {
		const v =
			typeof value === 'function'
				? /** @type {() => import("../types.js").MaybePromise<T>} */ (value)()
				: value;
		if (v instanceof Promise) {
			return v
				.then((v) => handler(v, true))
				.catch((e) => {
					const error = e instanceof Error ? e : new Error('Unknown Error', { cause: e });
					if (onError) return onError(error, true);
					throw error;
				});
		} else {
			return handler(v, false);
		}
	} catch (e) {
		const error = e instanceof Error ? e : new Error('Unknown Error', { cause: e });
		if (onError) return onError(error, false);
		else throw error;
	}
};
