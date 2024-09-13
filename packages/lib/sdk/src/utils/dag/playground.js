// import { Container, setTrackProxy } from '../../usql/setTrackProxy/setTrackProxy.js';
import { ActiveDagNode, DagNode, PassiveDagNode } from './DagNode.js';
import zip from 'lodash/zip.js';
/** @typedef {import('./playground.types.js').WithDag} WithDag */
/** @typedef {import('./playground.types.js').InputChild} InputChild */




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
		return this.#text;
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
		return `(${this.#text})`;
	}
}

/**
 * @param {any} x
 * @returns {x is WithDag}
 */
const isWithDagNode = (x) => typeof x === 'object' && x?.__dag instanceof DagNode;
