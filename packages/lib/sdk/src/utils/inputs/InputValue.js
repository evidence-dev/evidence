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
