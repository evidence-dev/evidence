/* global BigInt */

/** @typedef {{ new (): RecursiveProxyPrimitive & Record<string, any>}} SomeConstructor */

import { EvidenceError } from '../../../lib/EvidenceError.js';
export const PrimitiveValue = Symbol('PrimitiveValue');
export const InternalState = Symbol('InternalState');

/** @typedef {Symbol} Empty */
const Empty = Symbol();

const InternalJsonCall = Symbol();

/**
 * @typedef {string | number | boolean | BigInt | symbol | null | Date} Primitive
 */

/**
 * @typedef {Object} DeeplyAccessible
 * @property {boolean} Unset
 * @property {any} [parent]
 */

const IsDeeplyAccessibleProxy = Symbol('IsDeeplyAccessibleProxy');

/**
 * @typedef {Object} MakeDeeplyAccessibleOptions
 * @property {any} [parent]
 * @property {(key: string | symbol) => any} [propertyOverrides]
 */

/**
 * @template {{}} T
 * @template {{}} ChildType
 * @template {(prop: string | symbol, parent: T & DeeplyAccessible) => ChildType | Primitive} ChildFactory
 * @param {T} root
 * @param {ChildFactory} factory
 * @param {MakeDeeplyAccessibleOptions} [options]
 *
 * @returns {T & DeeplyAccessible & Record<string | symbol, any>}
 */
export const MakeDeeplyAccessible = (root, factory, options) => {
	const rootProtoKeys = Object.keys(Object.getPrototypeOf(root));

	/**
	 * @param {string | symbol} p g
	 * @returns {p is keyof typeof root}
	 */
	const isRootKey = (p) => p in root || rootProtoKeys.includes(p.toString());

	/** @type {Record<number | string | symbol, any>} */
	const state = Array.isArray(root) ? root : {};

	const result = new Proxy(root, {
		ownKeys(target) {
			// TODO: This doesn't seem to be working for some reason
			const result = Array.from(
				new Set([
					...Object.keys(target),
					...Object.keys(Array.isArray(state) ? Object.keys([]) : state)
				])
			);
			return result;
		},
		has(target, prop) {
			return isRootKey(prop) || prop in state;
		},
		get(target, prop) {
			if (isRootKey(prop)) {
				const overrideResult = options?.propertyOverrides?.bind(result)(prop);
				if (overrideResult !== undefined) return overrideResult;
				return target[prop];
			}
			if (prop === 'Unset') return true;
			if (prop === 'toJSON') return () => state;
			if (prop === 'toString') return root.toString.bind(root);
			if (prop === Symbol.toPrimitive) return () => state.toString();
			if (prop === IsDeeplyAccessibleProxy) return true;
			if (prop === InternalState) return state;
			if (prop in state) return state[prop];
			if (prop in Object.getPrototypeOf(state)) return state[prop];

			const overrideResult = options?.propertyOverrides?.bind(result)(prop);
			if (overrideResult !== undefined) return overrideResult;

			const newValue = factory(prop, typedResult);
			state[prop] = newValue;
			return newValue;
		},
		set(target, prop, value) {
			if (isRootKey(prop)) {
				// no-op on keys that are already present in the root object
				target[prop] = value;
				return true;
			}
			if (typeof value === 'object' && !(value instanceof Date)) {
				if (value[IsDeeplyAccessibleProxy]) {
					state[prop] = value; // noop
				} else {
					if (Array.isArray(value)) {
						state[prop] = MakeDeeplyAccessible([], factory);
					} else {
						state[prop] = factory(prop, typedResult);
					}
					for (const [k, v] of Object.entries(value)) {
						// If v is an object, that will be handled by the child proxy, not this one
						state[prop][k] = v;
					}
				}
			} else {
				state[prop] = value;
			}
			return true;
		}
	});
	const typedResult = /** @type {T & DeeplyAccessible} */ (result);

	return typedResult;
};

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

	/** @type {Set<string | symbol>} */
	#ignoredKeys = new Set();

	/**
	 * @param {string | symbol} key
	 * @returns {key is keyof typeof this}
	 */
	#checkIgnoredKey = (key) => {
		return this.#ignoredKeys.has(key);
	};

	/**
	 * @param {string|symbol} key
	 */
	ignoreKey = (key) => {
		this.#ignoredKeys.add(key);
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
		/**
		 *
		 * @returns
		 */
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
				if (prop === Empty)
					return () => {
						if (Array.isArray(this.#internalState)) {
							this.#internalState = [];
						} else {
							this.#internalState = {};
						}
					};
				if (hasKey(prop) || this.#checkIgnoredKey(prop)) {
					return this[prop];
				}
				if (prop.toString().startsWith('#')) {
					return undefined;
				}

				this.#hooks?.get?.accessed?.(prop, this);
				// 🚩 This prevents undefined from being a valid return value from intercept, might need to get smarter here
				const interceptedResult = this.#hooks?.get?.intercept?.(prop, this);
				if (typeof interceptedResult !== 'undefined') return interceptedResult;

				/**
				 * @param {string | symbol} prop
				 * @param {any} [proto]
				 */
				const extractFromProto = (prop, proto) => {
					if (prop in proto) {
						const v = proto[prop];
						if (typeof v === 'function') return v.bind(this.#value);
						return v;
					}
					return null;
				};

				/** @type {Record<string, any>} */
				const protoMap = {
					string: String.prototype,
					symbol: Symbol.prototype,
					number: Number.prototype,
					bigint: BigInt.prototype,
					boolean: Boolean.prototype,
					object: Date.prototype
				};

				if (!(prop in this.#internalState)) {
					if ((typeof this.#value) in protoMap) {
						const protoValue = extractFromProto(prop, protoMap[typeof this.#value]);
						if (protoValue) return protoValue;
					}

					this.#internalState[prop] = buildChild();
					this.#hooks?.get?.created?.(prop, this.#internalState[prop], this);
				}

				return this.#internalState[prop];
			},
			/**
			 *
			 * @param {unknown} _
			 * @param {string | symbol} prop
			 * @param {any} value
			 * @returns
			 */
			set: (_, prop, value) => {
				const isOwnValue = hasKey(prop) && !(this[prop] instanceof this.ChildConstructor);
				const isIgnored = this.#checkIgnoredKey(prop);
				if (isOwnValue || isIgnored) {
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
					childValue[Empty]();
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

		this.#hooks?.set?.valueSet?.(value, this);
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

	toString() {
		/** @type {any | any[]} */
		const internalState = Reflect.get(this, InternalState);
		/** @type {any} */
		const primitiveValue = Reflect.get(this, PrimitiveValue);

		if (Object.keys(internalState).length) {
			const v = this.toJSON(InternalJsonCall);

			if (v === '') return '';
			return JSON.stringify(v);
		} else if (this.hasValue) {
			// Operate on the primitive
			return primitiveValue?.toString();
		} else {
			return '';
		}
	}

	toJSON(/** @type {string | symbol} */ key) {
		/** @type {any | any[]} */
		const internalState = Reflect.get(this, InternalState);
		const primitiveValue = Reflect.get(this, PrimitiveValue);
		if (this.hasValue && !Object.keys(internalState).length) {
			return primitiveValue;
		} else {
			if (!Object.keys(internalState).length && !Array.isArray(internalState)) {
				if (key === InternalJsonCall) {
					return '';
				} else {
					return internalState;
				}
			}
			let out;
			if (Array.isArray(internalState)) {
				out = internalState
					.filter((/** @type {any} */ v) => v instanceof this.ChildConstructor)
					.map(/** @returns {any} */ (/** @type {RecursiveProxyPrimitive} */ v) => v.toJSON());
			} else {
				out = Object.fromEntries(
					Object.entries(internalState)
						.filter(([, v]) => v instanceof this.ChildConstructor)
						.map(([k, v]) => [k, v.toJSON()])
				);
			}

			return out;
		}
	}

	get hasValue() {
		return this.#hasValue;
	}

	/** @type {(hint: string) => string | boolean | number | symbol | undefined | Date | null} */
	[Symbol.toPrimitive](hint) {
		if (hint === 'string' || hint === 'default') {
			return this.toString();
		} else {
			// I don't understand this error, and we are playing fast and loose with
			// the types here anyways
			// @ts-expect-error See above, formatting me
			return Reflect.get(this, PrimitiveValue);
		}
	}

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
