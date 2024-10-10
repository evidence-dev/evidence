import type { RecursiveProxyPrimitive } from './RecursiveProxyPrimitive.js';
export type RecursiveProxyPrimitiveHooks = {
	get?: {
		/**
		 * 🚩 Tests for this
		 * Called when a new child is being created
		 * @param key Key the child is being set to
		 * @param childValue
		 * @returns {any | undefined} When undefined, the value will not be modified, otherwise the value is changed to the returned value
		 */
		created?: (
			key: string | symbol | number,
			childValue: RecursiveProxyPrimitive,
			this: RecursiveProxyPrimitive
		) => any | undefined;
		/**
		 *
		 * @param key Key that is being accessed
		 * @param this Object that is being accessed on
		 * @returns {any | undefined} When undefined, the regular behavior continues, when a value is provided it will be returned
		 */
		intercept?: (key: string | symbol | number, this: RecursiveProxyPrimitive) => any | undefined;
		accessed?: (key: Array<string | symbol | number>, this: RecursiveProxyPrimitive) => void;
	};
	set?: {
		/**
		 * Called when a primitive value is being set (e.g. setValue instead of prop = value)
		 * @param value
		 * @param this
		 * @returns
		 */
		valueSet?: (value: any, this: RecursiveProxyPrimitive) => void;
		inheritValueSet?: boolean;
		/**
		 * Called before setting a property
		 * @param property Modified Property
		 * @param value Value being set
		 * @returns {any | undefined} When undefined, the value will not be modified, otherwise the value is changed to the returned value
		 */
		pre?: (
			property: string | symbol | number,
			value: any,
			this: RecursiveProxyPrimitive
		) => any | undefined;
		/**
		 * When true, hooks will be passed to children
		 */
		inheritPre?: boolean;
		/**
		 * Called after setting a property
		 * @param property Modified Property
		 * @param value Value that was set. This will be wrapped in whatever child class is being used
		 * @returns {void}
		 */
		post?: (property: string | symbol | number, value: any, this: RecursiveProxyPrimitive) => void;
		/**
		 * When true, hooks will be passed to children
		 */
		inheritPost?: boolean;
	};
};

export type RecursiveProxyPrimitiveOptions = {
	hooks?: RecursiveProxyPrimitiveHooks;
};
