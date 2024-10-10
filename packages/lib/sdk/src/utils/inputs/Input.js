import { BlockingDagNode } from '../dag/DagNode.js';
import { MakeDeeplyAccessible } from '../proxies/recursive-proxy/RecursiveProxyPrimitive.js';
import { InputValue } from './InputValue.js';

const SqlFragmentFactory = Symbol();

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
export class Input extends InputValue {
	static DefaultValueText = '';
	static DefaultLabelText = '';

	static __ChildConstructor = InputValue;

	/** @type {BlockingDagNode} */
	get __dag() {
		return this.dag;
	}

	/** @type {BlockingDagNode} */
	dag;

	/** @type {import('./InputStore.js').InputStore | null} */
	#root = null;

	/** @type {string} */
	name;

	/** @type {((input: Input) => string | null) | null} */
	#sqlFragmentFactory = null;

	/** @type {boolean} */
	nestedValueSet = false;

	/**
	 * @param {string} name
	 * @param {InputOpts} [opts]
	 */
	constructor(name, { root = null, sqlFragmentFactory } = {}) {
		super();
		// super({
		// 	hooks: {
		// 		get: {
		// 			created: (prop, childValue) => {
		// 				// Ensure that even if a label hasn't been set on the store - we still treat it correctly
		// 				if (prop === 'label' && InputValue.isInputValue(childValue)) {
		// 					childValue.defaultStringify = Input.DefaultLabelText;
		// 					if (!childValue.hasValue) {
		// 						childValue.setValue(Input.DefaultLabelText);
		// 					}
		// 				}
		// 			},
		// 			intercept: (prop) => {
		// 				// @ts-expect-error
		//
		// 			}
		// 		},
		// 		set: {
		// 			valueSet: () => {
		// 				this.__dag?.trigger();
		// 			},
		// 			inheritValueSet: true,
		// 			post: (prop, childValue) => {
		// 				if (prop !== 'label') {
		// 					// Label is special, because it is not considered a value
		// 					flagChildSet();
		// 				} else if (!childValue.hasValue) {
		// 					childValue.setValue(Input.DefaultLabelText);
		// 				}
		// 				this.__dag?.trigger();
		// 			},
		// 			inheritPost: true
		// 		}
		// 	}
		// });
		this.#sqlFragmentFactory = sqlFragmentFactory ?? null;

		this.name = name;
		this.dag = new BlockingDagNode(name, this);

		if (root) {
			// 🚩 is this a good pattern?
			root.__dag.registerDependency(this.__dag);
			this.#root = root;
		}

		/**
		 * @template T
		 * @param {WithDag & T} obj
		 **/
		const dagTriggerOnModify = (obj) =>
			new Proxy(obj, {
				set: (target, prop, value) => {
					this.__dag?.trigger();
					return Reflect.set(target, prop, value);
				}
			});

		this.proxy = MakeDeeplyAccessible(this, () => dagTriggerOnModify(InputValue.create()), {
			/** @this {Input & import('./InputValue.js').DeeplyAccessible & Record<string, any>} */
			propertyOverrides(key) {
				if (key === 'label') {
					if ('label' in this) return this.label;
					else return Input.DefaultLabelText;
				}
				if (key === 'value') {
					if ('value' in this) return this.value;
					else return Input.DefaultValueText;
				}
				if (key in String.prototype && !(key in this)) {
					//@ts-expect-error Typescript really doesn't play nicely with `in`
					return String.prototype[key].bind(this.toString());
				}
			}
		});
		return dagTriggerOnModify(this.proxy);
	}

	/** @param {InputOpts} opts */
	updateOptions = (opts) => {
		this.#root = opts.root ?? this.#root;
		this.#sqlFragmentFactory = opts.sqlFragmentFactory ?? this.#sqlFragmentFactory;
	};

	get hasValue() {
		return 'value' in this.proxy || this.nestedValueSet;
	}

	[SqlFragmentFactory] = () => {
		return this.#sqlFragmentFactory;
	};

	toString = () => {
		if (this.#sqlFragmentFactory) return this.#sqlFragmentFactory(this.proxy);
		return JSON.stringify(this.proxy);
	};
	[Symbol.toPrimitive] = () => {
		if (this.#sqlFragmentFactory) return this.#sqlFragmentFactory(this.proxy);
		return this.toString();
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

// See the note in InputValue.js
Object.defineProperties(Input.prototype, {
	// __dag: { writable: true },
	nestedValueSet: { writable: true },
	updateOptions: { writable: true }
});
