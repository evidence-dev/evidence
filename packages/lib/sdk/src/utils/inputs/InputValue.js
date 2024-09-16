import { serializeTokens } from './constants.js';

/** @typedef {import('../dag/types.js').WithDag} WithDag */

/**
 * @param {InputValue & Record<string | symbol,any>} self
 */
function inputValueProxy(self) {
	return new Proxy(self, {
		get(target, prop) {
			if (serializeTokens.includes(prop)) return self.toString.bind(self);
			if (prop === Symbol.toStringTag) return 'InputValue';
			if (prop === 'toJSON') {
				return self.toString.bind(self);
			}
			if (!(prop in self)) {
				self[prop] = new InputValue(undefined, self.input);
			}
			console.log({
				prop,
				value: self[prop]
			});
			return self[prop];
		},
		set(target, prop, value) {
			if (!(value instanceof InputValue)) {
				target[prop] = new InputValue(value, self.input);
			} else {
				target[prop] = value;
			}

			self.input.modified = true;
			target.__dag.trigger();
			return true;
		}
	});
}

/**
 * @implements {WithDag}
 */
export class InputValue {
	#innerValue;
	input;

	/** @type {import("../dag/DagNode.js").PassiveDagNode} */
	get __dag() {
		return this.input.__dag;
	}

	get isSet() {
		return this.#innerValue !== undefined && this.#innerValue !== null;
	}

	/**
	 * @param {unknown} value
	 * @param {import("./Input.js").Input} input
	 */
	constructor(value, input) {
		this.#innerValue = value;
		this.input = input;

		return inputValueProxy(this);
	}

	toString = () => {
		return `${this.#innerValue}`;
	};
}
