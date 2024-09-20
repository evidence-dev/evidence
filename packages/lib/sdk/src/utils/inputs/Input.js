import { BlockingDagNode } from '../dag/DagNode.js';
import { RecursiveProxyPrimitive } from '../recursive-proxy/RecursiveProxyPrimitive.js';
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
	#sqlFragmentFactory = null;

	/** @type {boolean} */
	nestedValueSet = false;

	initialized = false;

	/**
	 * @param {string} name
	 * @param {InputOpts} [opts]
	 */
	constructor(name, { root = null, sqlFragmentFactory } = {}) {
		const flagChildSet = () => {
			this.nestedValueSet = true;
		};
		super({
			hooks: {
				get: {
					created: (prop, childValue) => {
						// Ensure that even if a label hasn't been set on the store - we still treat it correctly
						if (prop === 'label' && InputValue.isInputValue(childValue)) {
							childValue.defaultStringify = Input.DefaultLabelText;
							if (!childValue.hasValue) {
								childValue.setValue(Input.DefaultLabelText);
							}
						}
					}
				},
				set: {
					post: (prop, childValue) => {
						if (prop !== 'label') {
							// Label is special, because it is not considered a value
							flagChildSet();
						} else if (!childValue.hasValue) {
							childValue.setValue(Input.DefaultLabelText);
						}
						this.__dag.trigger();
					},
					inheritPost: true
				}
			}
		});
		this.#sqlFragmentFactory = sqlFragmentFactory ?? null;

		this.name = name;
		this.__dag = new BlockingDagNode(name, this);

		if (root) {
			// 🚩 is this a good pattern?
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
		if (this.#sqlFragmentFactory) return this.#sqlFragmentFactory(this);
		if (!this.hasValue) return Input.DefaultValueText;
		return super.toString();
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
