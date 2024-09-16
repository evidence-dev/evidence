import { serializeTokens } from './constants.js';
import { InputValue } from './InputValue.js';
import { BlockingDagNode } from '../dag/DagNode.js';

/** @typedef {import('../dag/types.js').WithDag} WithDag */

const reservedProps = ['__dag', '__sqlSnippet', 'sqlSnippet', 'isSet', 'modified'];

/**
 * @param {Input & Record<string | symbol,any>} self
 */
function inputProxy(self) {
	const proxied = new Proxy(self, {
		get(target, prop) {
			if (serializeTokens.includes(prop)) return self.toString.bind(self);
			if (prop === Symbol.toStringTag) return 'Input';
			if (!(prop in target) && !reservedProps.includes(prop.toString())) {
				target[prop] = new InputValue(undefined, proxied);
			}

			return target[prop];
		},
		set(target, prop, value) {
			if (!(value instanceof InputValue) && !reservedProps.includes(prop.toString())) {
				target[prop] = new InputValue(value, proxied);
				self.modified = true;
			} else {
				target[prop] = value;
			}

			if (!reservedProps.includes(prop.toString())) {
				target.__dag.trigger();
			}
			return true;
		}
	});

	return proxied;
}

/**
 * @implements {WithDag}
 */
export class Input {
	/** @type {BlockingDagNode} */
	__dag;

	/** @type {((self: Input) => string) | undefined} */
	#snippetFactory;

	get sqlSnippet() {
		return this.#snippetFactory?.(this) ?? '';
	}

	modified = false;
	get isSet() {
		return this.modified;
	}

	/**
	 * @param {string} name
	 * @param {(self: Input) => string} [sqlSnippetFactory]
	 */
	constructor(name, sqlSnippetFactory) {
		this.#snippetFactory = sqlSnippetFactory;
		this.__dag = new BlockingDagNode(name, this);
		return inputProxy(this);
	}

	toString = () => {
		return this.sqlSnippet;
	};

	/**
	 *
	 * @param {unknown} v
	 * @returns {v is Input}
	 */
	static isInput(v) {
		console.log({ v });
		return true;
	}

	update() {
		this.__dag.trigger();
	}
}
