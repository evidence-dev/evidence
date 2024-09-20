import { RecursiveProxyPrimitive } from '../recursive-proxy/RecursiveProxyPrimitive.js';
import { Input } from './Input.js';

export class InputValue extends RecursiveProxyPrimitive {
	get __dag() {
		let p = this.parent;
		while (p instanceof InputValue) {
			p = p.parent;
		}
		if (p && '__dag' in p) return p.__dag;
		return null;
	}

	defaultStringify = Input.DefaultValueText;

	['🦆'] = '__EvidenceInputValue__';

	/**
	 * @param {unknown} v
	 * @returns {v is InputValue}
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
// InputValue.prototype['🦆'] = '__EvidenceInputValue__'
// InputValue.prototype.defaultStringify = ''

Object.defineProperties(InputValue.prototype, {
	['🦆']: { writable: true },
	defaultStringify: { writable: true }
});
