// import { Container, setTrackProxy } from '../../usql/setTrackProxy/setTrackProxy.js';
import { ActiveDagNode, DagNode, PassiveDagNode } from './DagNode.js';
import zip from "lodash/zip.js"
/** @typedef {import('./playground.types.js').WithDag} WithDag */
/** @typedef {import('./playground.types.js').InputChild} InputChild */
const serializeTokens = ['toString', 'toPrimitive', Symbol.toPrimitive];

/**
 *
 * @param {Input & Record<string | symbol,any>} self
 */
function inputProxy(self) {
	const proxied = new Proxy(self, {
		get(target, prop) {
			if (serializeTokens.includes(prop)) return self.toString.bind(self);
			if (prop === Symbol.toStringTag) return 'Input';
			if (!(prop in target)) {
				target[prop] = new InputValue(undefined, proxied);
			}

			return target[prop];
		},
		set(target, prop, value) {
			if (!(value instanceof InputValue) && prop !== 'sqlSnippet') {
				target[prop] = new InputValue(value, proxied);
			} else {
				target[prop] = value;
			}
			return true;
		}
	});

	return proxied;
}

/**
 * @param {InputValue & Record<string | symbol,any>} self
 */
function inputValueProxy(self) {
	return new Proxy(self, {
		get(target, prop) {
			if (serializeTokens.includes(prop)) return self.toString.bind(self);
			if (prop === Symbol.toStringTag) return 'InputValue';

			if (!(prop in self)) {
				self[prop] = new InputValue(undefined, self.input);
			}

			return self[prop];
		},
		set(target, prop, value) {
			let didTransform = false;
			if (!(value instanceof InputValue)) {
				target[prop] = new InputValue(value, self.input);
				didTransform = true;
			} else {
				target[prop] = value;
			}
			return true;
		}
	});
}

/**
 * @implements {WithDag}
 */
export class Input {
	/** @type {PassiveDagNode} */
	__dag;

    /** @type {string} */
	set sqlSnippet(v) {
		this.__sqlSnippet = v;
	}
	/** @type {string} */
	__sqlSnippet = '';

	/** @param {string} name } */
	constructor(name) {
		this.__dag = new PassiveDagNode(name);
		return inputProxy(this);
	}

	toString = () => {
		return this.__sqlSnippet;
	};
}

/**
 * @implements {WithDag}
 */
export class InputValue {
	#innerValue;
	input;

	/** @type {PassiveDagNode} */
	get __dag() {
		return this.input.__dag;
	}

	/**
	 * @param {unknown} value
	 * @param {Input} input
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
/**
 * @implements {WithDag}
 */
export class Query {
	/** @type {ActiveDagNode} */
	__dag;

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.__dag = new ActiveDagNode(name, () => {});
	}

    #text = '';

    get text() {
        return this.#text
    }

	/**
	 * @param {TemplateStringsArray} strs
	 * @param  {...any} args
	 */
	update(strs, ...args) {
		args.forEach((arg) => {
			if (isWithDagNode(arg)) {
				this.__dag.registerDependency(arg.__dag);
			}
		});

        // TODO: Run the query / flag the query for re-execution
		this.#text = zip(strs, args).flat().join('').trim();
	}

    toString() {
        return `(${this.#text})`
    }
}

/**
 * @param {any} x
 * @returns {x is WithDag}
 */
const isWithDagNode = (x) => typeof x === 'object' && x?.__dag instanceof DagNode;
