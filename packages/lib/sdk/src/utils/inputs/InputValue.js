import {
	InternalState,
	PrimitiveValue,
	RecursiveProxyPrimitive
} from '../recursive-proxy/RecursiveProxyPrimitive.js';
import { Input } from './Input.js';
// export class InputValue {
// 	/** @type {any} */
// 	get value() {
// 		return this.#innerState.value;
// 	}

// 	/** @type {any} */
// 	#innerState = {};

// 	constructor() {
// 		/**
// 		 * @param {string | symbol | number} v
// 		 * @returns {v is keyof InputValue}
// 		 */
// 		const isKey = (v) => v in this;

// 		const proxy = new Proxy(this, {
// 			get: (_, prop) => {
// 				if (isKey(prop)) {
// 					return this[prop];
// 				} else {
// 					switch (prop) {
// 						case Symbol.toPrimitive:
// 						case 'toString':
// 							return () => this.value;
// 						case 'toJSON':
// 							return () => JSON.stringify(this.value);

// 						default:
// 							const newValue = new InputValue();
// 							this.#innerState[prop] = newValue;
// 							return newValue;
// 					}
// 				}
// 			},
// 			set: (_, prop, value) => {
// 				console.log({
// 					prop,
// 					value
// 				});
// 				if (isKey(prop)) {
// 					this[prop] = value;
// 					return true;
// 				}
// 				if (InputValue.isInputValue(value)) {
// 					this.#innerState[prop] = value;
// 					return true;
// 				}
// 				console.log('FOO');
// 				const newValue = new InputValue();
// 				newValue.value = value;
// 				this.#innerState[prop] = newValue;

// 				return true;
// 			}
// 		});

// 		return proxy;
// 	}

// 	toString() {
// 		return 'InputValue';
// 	}

export class InputValue extends RecursiveProxyPrimitive {
	get __dag() {
		let p = this.parent;
		while (p instanceof InputValue) {
			p = p.parent;
		}
		if (p && '__dag' in p) return p.__dag;
		return null;
	}

	['🦆'] = '__EvidenceInputValue__';

	toString = () => {
		const innerValue = this[PrimitiveValue];
		if (this.hasValue) {
			return innerValue?.toString() ?? '';
		} else {
			return Input.DefaultValueText;
		}
	};
	toJSON = () => {
		if (this.hasValue) {
			return this[PrimitiveValue];
		} else {
			return this[InternalState];
		}
	};

	/**
	 * @param {unknown} v
	 * @returns {v is InputValue}
	 */
	static isInputValue(v) {
		if (!v || typeof v !== 'object') return false;
		return '🦆' in v && v['🦆'] === '__EvidenceInputValue__';
	}
}
