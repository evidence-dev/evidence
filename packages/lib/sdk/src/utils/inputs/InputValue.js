import { MakeDeeplyAccessible } from '../proxies/recursive-proxy/RecursiveProxyPrimitive.js';
import { Input } from './Input.js';
export const ToMarkdown = Symbol('ToMarkdown');
/** @typedef {import("../proxies/recursive-proxy/RecursiveProxyPrimitive.js").DeeplyAccessible} DeeplyAccessible */

export class InputValue {
	/**
	 * @returns {InputValue & DeeplyAccessible}
	 */
	static create() {
		const output = MakeDeeplyAccessible(new InputValue(), InputValue.create);
		return /** @type {InputValue & DeeplyAccessible} */ (output);
	}

	/**
	 * @protected
	 */
	constructor() {}

	/** @this {InputValue & DeeplyAccessible} */
	get __dag() {
		let p = this.parent;
		while (InputValue.isInputValue(p)) {
			p = p.parent;
		}
		if (p && '__dag' in p) return p.__dag;
		return null;
	}

	defaultStringify = Input.DefaultValueText;

	['🦆'] = '__EvidenceInputValue__';

	/**
	 * @param {unknown} v
	 * @returns {v is InputValue & DeeplyAccessible}
	 */
	static isInputValue(v) {
		if (!v || typeof v !== 'object') return false;
		return '🦆' in v && v['🦆'] === '__EvidenceInputValue__';
	}
}

/*
	This is a somewhat unfortunate hack that is needed to appease node 18

	For some reason, it handles the setting of a value on the class differently than node 20
		- Node 20 sets the value on the class, without going through the proxy
		- Node 18 sets the value on the proxy, rather than the class
	
	This leads to infinite recursion issues whenever you try to instantiate the class
		If you comment this out, and run the test suite with node 18 you will get the error.

	By assigning these properties to the prototypes directly, then the `hasKey` function in RecursiveProxyPrimitive
	will properly detect them, and treat them as class properties properly.

*/
Object.defineProperties(InputValue.prototype, {
	['🦆']: { writable: true },
	defaultStringify: { writable: true }
});
