import type { RecursiveProxyPrimitive } from './RecursiveProxyPrimitive.js';
export type RecursiveProxyPrimitiveHooks = {
	set?: {
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
