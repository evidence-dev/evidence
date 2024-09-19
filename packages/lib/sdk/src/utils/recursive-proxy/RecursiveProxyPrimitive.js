/** @typedef {{ new (): RecursiveProxyPrimitive & Record<string, any>}} SomeConstructor */

import { EvidenceError } from '../../lib/EvidenceError.js';
export const PrimitiveValue = Symbol('PrimitiveValue');
export const InternalState = Symbol('InternalState');
/**
 * The RecursiveProxyPrimative is used to create classes that can be infinitely addressed.
 *
 * @example
 * ```ts
 * class SomeSubClass extends RecursiveProxyPrimative {}
 * const myInstance = new SomeSubClass();
 * console.assert(myInstance.x.y.z instanceof SomeSubClass); // true
 * ```
 */
export class RecursiveProxyPrimitive {
	// TODO: Find some way to type check this? It needs to be a subclass of RecursiveProxyPrimative
	/** @type {SomeConstructor} */
	static __ChildConstructor;

	static get ChildConstructor() {
		return this.__ChildConstructor;
	}

	/** @type {SomeConstructor} */
	get ChildConstructor() {
		// @ts-expect-error
		return this.constructor.ChildConstructor ?? this.constructor;
	}

	/** @type {any | any[]} */
	#internalState = {};

	/** @type {this} */
	#proxy;
	get proxy() {
		return this.#proxy;
	}

	/** @type {import("./types.js").RecursiveProxyPrimitiveHooks | undefined} */
	#hooks;
	/**
	 *
	 * @param {import("./types.js").RecursiveProxyPrimitiveHooks} hooks
	 */
	updateHooks = (hooks) => {
		this.#hooks = hooks;
	};

	/** @type {RecursiveProxyPrimitive | null} */
	#parent = null;
	get parent() {
		return this.#parent;
	}
	/** @param {RecursiveProxyPrimitive | null} parent */
	setParent = (parent) => {
		if (!parent) return;
		this.#parent = parent;
	};

	/**
	 * @param {import("./types.js").RecursiveProxyPrimitiveOptions} [options]
	 * @returns
	 */
	constructor(options = {}) {
		if (this.constructor === RecursiveProxyPrimitive) {
			throw new Error(
				'RecursiveProxyPrimative cannot be instantiated, and should be treated as an abstract class'
			);
		}
		if (options.hooks) this.updateHooks(options.hooks);
		const buildChild = () => {
			const out = new this.ChildConstructor();
			/** @type {import("./types.js").RecursiveProxyPrimitiveHooks} */
			const newHooks = {};
			newHooks.set = {
				post: this.#hooks?.set?.inheritPost ? this.#hooks.set.post : undefined,
				inheritPost: this.#hooks?.set?.inheritPost,
				pre: this.#hooks?.set?.inheritPre ? this.#hooks.set.pre : undefined,
				inheritPre: this.#hooks?.set?.inheritPre
			};
			out.updateHooks(newHooks);
			out.setParent(this.proxy);

			return out;
		};

		/**
		 * @param {string | symbol} key
		 * @returns {key is keyof typeof this}
		 */
		const hasKey = (key) => {
			return key in this;
		};

		this.#proxy = new Proxy(this, {
			get: (_, prop) => {
				if (hasKey(prop)) {
					return this[prop];
				}
				if (prop.toString().startsWith('#')) {
					return undefined;
				}
				if (!(prop in this.#internalState)) {
					this.#internalState[prop] = buildChild();
				}

				return this.#internalState[prop];
			},
			set: (_, prop, value) => {
				if (hasKey(prop) && !(this[prop] instanceof this.ChildConstructor)) {
					this[prop] = value;
					return true;
				}
				const result = this.#hooks?.set?.pre?.(prop, value, this);
				if (typeof result !== 'undefined') {
					value = result;
				}
				let childValue = this.#internalState[prop];
				if (!(prop in this.#internalState)) {
					childValue = buildChild();
					this.#internalState[prop] = childValue;
				}

				if (typeof value === 'object') {
					if (!(value instanceof this.ChildConstructor)) {
						// Recursively create more values
						if (Array.isArray(value)) {
							childValue.convertToArray();
						}
						for (const [k, v] of Object.entries(value)) {
							childValue[k] = v;
						}
					}
				} else {
					childValue.setValue(value);
				}

				this.#hooks?.set?.post?.(prop, childValue, this);

				return true;
			}
		});

		return this.#proxy;
	}

	/** @type {string | symbol | number | boolean | Date | undefined | null} */
	#value;

	#hasValue = false;

	/** @param {string | symbol | number | boolean | Date | undefined | null} value */
	setValue = (value) => {
		if (typeof value === 'object' && !(value instanceof Date)) {
			throw new EvidenceError(`Value must be a primitive, found ${JSON.stringify(value)}`);
		}
		this.#hasValue = true;

		this.#value = value;
	};

	convertToArray = () => {
		const previousState = this.#internalState;
		this.#internalState = [];
		Object.assign(this.#internalState, previousState);
	};

	get [PrimitiveValue]() {
		return this.#value;
	}
	get [InternalState]() {
		return this.#internalState;
	}

	/** @param {RecursiveProxyPrimitive} s */
	static getValue = (s) => {
		return s.#value;
	};

	toString = () => {
		return String(this.#value);
	};

	toJSON = () => {
		if (this.hasValue && !Object.keys(this.#internalState).length) {
			return this.#value;
		} else {
			let out;
			if (Array.isArray(this.#internalState)) {
				out = this.#internalState
					.filter((v) => v instanceof this.ChildConstructor)
					.map((v) => v.toJSON());
			} else {
				out = Object.fromEntries(
					Object.entries(this.#internalState)
						.filter(([, v]) => v instanceof this.ChildConstructor)
						.map(([k, v]) => [k, v.toJSON()])
				);
			}
			return out;
		}
	};

	get hasValue() {
		return this.#hasValue;
	}

	/** @type {() => string | boolean | number | symbol | undefined | Date | null} */
	[Symbol.toPrimitive] = () => {
		if (this.hasValue) return this.#value;
		return this.toString();
	};

	/** @param {string | symbol | number} prop */
	get = (prop) => {
		if (!(prop in this.#internalState)) return undefined;
		const v = this.#internalState[prop];
		if (!(v instanceof this.ChildConstructor)) return null;
		return v.toJSON();
	};

	/**
	 * @param {string | symbol | number} prop
	 */
	has = (prop) => {
		if (!(prop in this.#internalState)) return false;
		const v = this.#internalState[prop];
		if (!(v instanceof this.ChildConstructor)) return false;
		return v.hasValue;
	};
}
