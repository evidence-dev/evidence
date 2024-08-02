import { setContext, getContext, getAllContexts } from 'svelte';
import { get, writable } from 'svelte/store';
import { MiddlewareMapKey, MiddlewareContextKey } from './middleware.keys.js';

export const createMiddlewareContext = () => {
	// We are checking to see if the context is already set because
	// this is being applied in preprocess - rather than the layout.
	// We want to ensure that this context is _always_ set to prevent the
	// context from disappearing if the user creates a custom layout file.
	const allContexts = getAllContexts();
	if (!(MiddlewareContextKey in allContexts)) {
		setContext(
			MiddlewareContextKey,
			writable({
				[MiddlewareMapKey]: []
			})
		);
		console.log('Created Middleware Context!');
	}
};

/** @typedef {import("svelte/store").Writable<MiddlewareContextValue>} MiddlewareContext */
/** @typedef {import("./types.js").MiddlewareContextValue} MiddlewareContextValue */

/**
 * @param {MiddlewareContextValue[MiddlewareMapKey][number]} value
 * @param {boolean} [prepend=false]
 */
export const addMapMiddleware = (value, prepend) => {
	console.log(getAllContexts());
	/** @type {MiddlewareContext} */
	const { update } = getContext(MiddlewareContextKey);

	update((v) => {
		if (prepend) v[MiddlewareMapKey].unshift(value);
		else v[MiddlewareMapKey].push(value);
		return v;
	});
	console.log('We added a middleware!');
};

export const getMapMiddleware = () => get(getContext(MiddlewareContextKey))[MiddlewareMapKey];

/**
 * @template T
 * @param {T} initialValue
 * @param {import("./types.js").Middlewares<T>} middlewares
 */
export const processMiddlewares = (initialValue, middlewares) => {
	console.log('Processing Middlewares!', { initialValue, middlewares });
	let value = initialValue;
	for (const middleware of middlewares) {
		const output = middleware(value);
		if (output) value = output;
	}
	return value;
};
