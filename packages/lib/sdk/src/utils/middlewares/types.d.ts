import { Map } from 'leaflet';
import { Writable } from 'svelte/store';
import type { MiddlewareContextKey, MiddlewareMapKey } from './middleware.keys.js';

export type MiddlewareContextValue = {
	[MiddlewareMapKey]: Middlewares<Map>;
};

export type Middlewares<T, FnType extends (input: T) => T = (input: T) => T> = Array<FnType>;

export type MapMiddleware = MiddlewareContextValue[MiddlewareMapKey];
