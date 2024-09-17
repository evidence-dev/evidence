import { BlockingDagNode } from '../dag/DagNode.js';
import {
	PrimitiveValue,
	RecursiveProxyPrimitive
} from '../recursive-proxy/RecursiveProxyPrimitive.js';
import { InputValue } from './InputValue.js';

/** @typedef {import("../dag/DagNode.js").DagNode} DagNode */
/** @typedef {import("../dag/types.js").WithDag} WithDag */

/**
 * @typedef {Object} InputOpts
 * @property {import('./InputStore.js').InputStore | null} [root]
 * @property {(input: Input) => string | null} [sqlFragmentFactory]
 * @property {() => unknown} [publish]
 */

/**
 * @implements {WithDag}
 */
export class Input extends RecursiveProxyPrimitive {
	static DefaultValueText = '';
	static DefaultLabelText = '';

	static __ChildConstructor = InputValue;

	/** @type {BlockingDagNode} */
	__dag;

	/** @type {import('./InputStore.js').InputStore | null} */
	#root = null;

	/** @type {string} */
	name;

	/** @type {((input: Input) => string | null) | null} */
	#sqlFragmentFactory;

	/** @type {boolean} */
	nestedValueSet = false;

	/**
	 *
	 * @param {string} name
	 * @param {InputOpts} [opts]
	 */
	constructor(name, { root = null, sqlFragmentFactory } = {}) {
		const flagChildSet = () => {
			this.nestedValueSet = true;
		};
		super({
			hooks: {
				set: {
					post: () => {
						flagChildSet();
						this.__dag.trigger();
						// TODO: This needs to be the actual value
						// this.setValue(this.toString());
					},
					inheritPost: true
				}
			}
		});
		this.#sqlFragmentFactory = sqlFragmentFactory ?? null;

		this.name = name;
		this.__dag = new BlockingDagNode(name, this);

		if (root) {
			// TODO: is this a good pattern?
			root.__dag.registerDependency(this.__dag);
			this.#root = root;
		}
		return this.proxy;
	}

	/** @param {InputOpts} opts */
	updateOptions = (opts) => {
		this.#root = opts.root ?? this.#root;
		this.#sqlFragmentFactory = opts.sqlFragmentFactory ?? this.#sqlFragmentFactory;
	};

	get hasValue() {
		return super.hasValue || this.nestedValueSet;
	}

	toString = () => {
		const innerValue = this[PrimitiveValue];

		if (this.hasValue) {
			console.log(this.#sqlFragmentFactory);
			if (this.#sqlFragmentFactory) {
				const value = this.#sqlFragmentFactory(this);
				if (value !== null) return value;
			}
			return innerValue?.toString() ?? '';
		} else {
			return Input.DefaultValueText;
		}
	};
	toJSON = () => {
		if (this.hasValue) {
			return this[PrimitiveValue];
		} else {
			return this;
		}
	};
	['🦆'] = '__EvidenceInput__';

	/**
	 * @param {unknown} v
	 * @returns {v is Input}
	 */
	static isInput(v) {
		if (!v || typeof v !== 'object') return false;
		return '🦆' in v && v['🦆'] === '__EvidenceInput__';
	}
}
// export class Input {

// 	/**
// 	 *
// 	 * @param {string} name
// 	 * @param {InputOpts} [opts]
// 	 */
// 	constructor(name, { blocking = false, root = null } = {}) {
// 		this.name = name;
// 		if (blocking) {
// 			this.__dag = new BlockingDagNode(name, this);
// 		} else {
// 			this.__dag = new PassiveDagNode(name, this);
// 		}
// 		if (root) {
// 			// TODO: is this a good pattern?
// 			root.__dag.registerDependency(this.__dag);
// 			this.#root = root;
// 		}

// 		/**
// 		 * @param {string | symbol | number} v
// 		 * @returns {v is keyof Input}
// 		 */
// 		const isKey = (v) => v in this;

// 		/**
// 		 * @param {Input} _
// 		 * @param {keyof Input | string | symbol} prop
// 		 */
// 		this.#proxied = new Proxy(this, {
// 			get: (_, prop) => {
// 				if (isKey(prop)) {
// 					return this[prop];
// 				}
// 				if (prop in this.#innerState) {
// 					console.log('Hello?');
// 					return this.#innerState[prop];
// 				}
// 				switch (prop) {
// 					case Symbol.toPrimitive:
// 						return () => this.value;
// 					case 'toString':
// 						return () => this.value;
// 					case 'toJSON':
// 						return () => JSON.stringify(this.value);
// 					default:
// 						const newValue = new InputValue();
// 						console.log(`Creating new value at ${prop.toString()} in ${this.name}`);
// 						this.#innerState[prop] = newValue;
// 						return newValue;
// 				}
// 			},
// 			set: (_, prop, value) => {
// 				if (prop.toString().startsWith('#') || ['🦆', '__dag'].includes(prop.toString())) {
// 					console.warn(`Attempted to set read-only property ${prop.toString()}`);
// 					return true;
// 				}
// 				if (InputValue.isInputValue(value)) {
// 					this.#innerState[prop] = value;
// 					return true;
// 				}
// 				const wrappedValue = new InputValue();
// 				wrappedValue.value = value;
// 				this.#innerState[prop] = wrappedValue;
// 				console.log('I set #innerState!', this.#innerState);

// 				// These need to be InputValue
// 				return true;
// 			}
// 		});
// 		return this.#proxied;
// 	}

// 	get value() {
// 		return this.#innerState.value ?? Input.DefaultValueText;
// 	}

// 	/** @type {string} */
// 	get label() {
// 		return this.#innerState.label ?? Input.DefaultLabelText;
// 	}

// 	update() {
// 		this.__dag.trigger().then(() => {});
// 	}

// 	toString() {
// 		return this.value;
// 	}

// 	['🦆'] = '__EvidenceInput__';

// 	/**
// 	 * @param {unknown} v
// 	 * @returns {v is Input}
// 	 */
// 	static isInput(v) {
// 		if (!v || typeof v !== 'object') return false;
// 		return '🦆' in v && v['🦆'] === '__EvidenceInput__';
// 	}
// }
