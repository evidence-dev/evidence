import { EvidenceError } from '../../lib/EvidenceError.js';

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
/**
 * @template T
 * @template [Returns=void]
 * @param {(vs: T[], isPromise: boolean) => import("../types.js").MaybePromise<Returns>} handler
 * @param {Array<import("../types.js").MaybePromise<T> | (() => import("../types.js").MaybePromise<T>)>} values
 * @param {(e: Error[], isPromise: boolean) => import("../types.js").MaybePromise<Returns>} [onError]
 */
export const resolveMaybePromises = (handler, values, onError) => {
	/**
	 *
	 * @param {Array<any>} vs
	 * @returns {vs is T[]}
	 */
	const sync = (vs) => vs.every((v) => !(v instanceof Promise));
	try {
		const mappedValues = values.map((value) =>
			typeof value === 'function'
				? /** @type {() => import("../types.js").MaybePromise<T>} */ (value)()
				: value
		);

		if (!sync(mappedValues)) {
			return Promise.all(
				mappedValues.map((v) => (v instanceof Promise ? v : Promise.resolve(v)))
			).then((results) => {
				if (results.some((v) => v instanceof Error)) {
					const errors = results.filter((v) => v instanceof Error);
					if (onError) return onError(errors, true);
					throw new EvidenceError(`Failed to resolve all promises`, [], { cause: errors });
				}
				return handler(results, true);
			});
		} else {
			const results = mappedValues.map((v) => (v instanceof Promise ? v : v));
			if (results.some((v) => v instanceof Error)) {
				const errors = results.filter((v) => v instanceof Error);
				if (onError) return onError(errors, false);
				throw new EvidenceError(`Failed to resolve all promises`, [], { cause: errors });
			}
			return handler(results, false);
		}
	} catch (e) {
		const error = e instanceof Error ? e : new Error('Unknown Error', { cause: e });
		if (onError) return onError([error], false);
		else throw error;
	}
};
