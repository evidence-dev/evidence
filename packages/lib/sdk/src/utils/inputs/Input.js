import { BlockingDagNode } from '../dag/DagNode.js';
import {
	InternalState,
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
	#sqlFragmentFactory = null;

	/** @type {boolean} */
	nestedValueSet = false;

	initialized = false;

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
					post: (prop) => {
						if (prop !== 'label') {
							// Label is special, because it is not considered a value
							flagChildSet();
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
		console.log(this.hasValue, this.#sqlFragmentFactory);
		if (this.hasValue) {
			if (this.#sqlFragmentFactory) {
				const value = this.#sqlFragmentFactory(this);
				if (value !== null) return value;
			}

			return this[PrimitiveValue]?.toString() ?? '';
		} else {
			return Input.DefaultValueText;
		}
	};
	toJSON = () => {
		if (this.hasValue) {
			return this[PrimitiveValue];
		} else {
			return Object.fromEntries(
				Object.entries(this[InternalState]).filter(([, v]) => InputValue.isInputValue(v))
			);
		}
	};

	// 🚩 is this an appropriate usage?
	/** @param {keyof Input} prop */
	get = (prop) => {
		if (!(prop in this[InternalState])) return undefined;
		const v = this[InternalState][prop];
		if (!InputValue.isInputValue(v)) return null;
		return v[PrimitiveValue];
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
