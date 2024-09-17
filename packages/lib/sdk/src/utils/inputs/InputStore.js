import { storeMixin } from '../../lib/store-helpers/storeMixin.js';
import { ActiveDagNode } from '../dag/DagNode.js';
import { Input } from './Input.js';

/** @typedef {import("../dag/types.js").WithDag} WithDag */

/**
 * @implements {WithDag}
 */
export class InputStore {
	#storeMixin = storeMixin();
	subscribe = this.#storeMixin.subscribe.bind(this.#storeMixin);
	update = this.#storeMixin.update.bind(this.#storeMixin);

	/** @type {import("../dag/DagNode.js").ActiveDagNode} */
	__dag;
	/** @type {InputStore} */
	#proxied;

	get proxy() {
		return this.#proxied;
	}

	/**
	 * @param {string | symbol | number} k
	 * @returns {k is keyof InputStore}
	 */
	isOwnKey = (k) => k in this;

	/**
	 * @this {InputStore & {[key: string | symbol]: import("./Input.js").Input}}
	 */
	constructor() {
		const rootDagNode = new ActiveDagNode(
			'InputStore',
			(epochId, defer) => {
				defer(() => {
					this.#storeMixin.publish(this.#proxied);
				});

				return true;
			},
			this
		);
		this.__dag = rootDagNode;

		this.#proxied = new Proxy(this, {
			/**
			 * @param {InputStore} _
			 * @param {keyof InputStore | string | symbol} prop
			 */
			get: (_, prop) => {
				switch (prop) {
					default: {
						if (this.isOwnKey(prop)) {
							return this[prop];
						}
						const newValue = new Input(prop.toString(), {
							root: this,
							publish: () => this.#storeMixin.publish(this.#proxied)
						});
						this[prop] = newValue;
						return newValue;
					}
				}
			}
		});
		this.#storeMixin.publish(this.#proxied);
		return this.#proxied;
	}

	/**
	 *
	 * @param {string | symbol} name
	 * @param {Omit<import('./Input.js').InputOpts, 'root' | 'publish'>} [options]
	 * @returns {Input | null}
	 */
	ensureInput(name, options) {
		if (this.isOwnKey(name)) {
			const value = this[name];
			if (Input.isInput(value)) {
				value.updateOptions({ ...options, publish: undefined, root: this });
				return value;
			} else {
				console.error(`${name} is not an Input`);
				return null;
			}
		} else {
			console.log('Creating new', name);
			// make a new one
			const newInput = new Input(name.toString(), {
				...options,
				root: this,
				publish: () => this.#storeMixin.publish(this.#proxied)
			});
			// @ts-expect-error I don't know how to fix this, needs {[key: string | symbol]: Input}
			this[name] = newInput;
			return newInput;
		}
	}

	['🦆'] = '__EvidenceInputStore__';

	/**
	 * @param {unknown} v
	 * @returns {v is InputStore}
	 */
	static isInputStore(v) {
		if (!v || typeof v !== 'object') return false;
		return '🦆' in v && v['🦆'] === '__EvidenceInputStore__';
	}
}
