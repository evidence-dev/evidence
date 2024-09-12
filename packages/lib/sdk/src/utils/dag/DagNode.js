// TODO: Move instanceof to duck typing

import { nanoid } from 'nanoid';

/**
 * @template T
 * @typedef {import('../../usql/types.js').MaybePromise<T>} MaybePromise
 */

/**
 * @typedef {() => MaybePromise<unknown>} ExecFn
 */

export class DagNode {
	/** @type {boolean} */
	get dirty() {
		throw new Error('abstract lol');
	}

	/** @type {string} */
	name;
	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.name = name;
	}

	/** @type {Set<DagNode>} */
	parents = new Set();
	/** @type {Set<DagNode>} */
	children = new Set();

	/** @type {Set<DagNode>} */
	get #allDeps() {
		const allDeps = new Set();
		this.children.forEach((child) => {
			allDeps.add(child);
			child.#allDeps.forEach((dep) => allDeps.add(dep));
		});
		return allDeps;
	}

	/** @param {DagNode} dep */
	registerDependency = (dep) => {
		if (this.#allDeps.has(dep)) {
			// TODO: Print the chain?
			throw new Error('Detected Circular Dependency');
		}
		this.parents.add(dep);
		dep.children.add(this);
		return true;
	};

	/**
	 * @param {Symbol} epochId
	 */
	markChildrenDirty = (epochId) => {
		this.children.forEach((child) => {
			if (child instanceof ActiveDagNode) {
				child.markDirty(epochId);
			}
			child.markChildrenDirty(epochId);
		});
	};

	/**
	 * @param {Symbol} epochId
	 * @deprecated "Use trigger instead"
	 * @ignore
	 */
	async flush(epochId) {
		for (const child of this.children) {
			if (child instanceof ActiveDagNode) {
				await child.tidy(epochId);
			}

			await child.flush(epochId);
		}
	}

	async trigger() {
		// Use symbol so that we only get referential equality
		const epochId = Symbol(nanoid());

		this.markChildrenDirty(epochId);
		await this.flush(epochId);
	}

	get mermaidName() {
		return this.name;
	}

	/** @returns {string} */
	toMermaid() {
		const childLines = Array.from(this.children).flatMap((child) => [
			...child.toMermaid().split('\n'),
			`${this.name} --> ${child.name}`
		]);

		return Array.from(new Set([this.mermaidName, ...childLines])).join('\n');
	}
}
// ??
export class ActiveDagNode extends DagNode {
	/** @type {ExecFn} */
	exec;

	/**
	 *
	 * @param {Symbol} epochId
	 */
	tidy = async (epochId) => {
		const parentsClean = [...this.parents].every((parent) => !parent.dirty);
		const correctEpoch = this.#epochId === epochId;
		const canExec = parentsClean && correctEpoch && this.dirty;
		if (canExec) {
			if (this.exec) {
				await this.exec();
			}
			this.#dirty = false;
		}
	};

	/**
	 * @param {string} name
	 * @param {ExecFn} exec
	 */
	constructor(name, exec) {
		super(name);
		this.exec = exec;
	}

	/** @type {boolean} */
	#dirty = false;
	/** @type {boolean} */
	get dirty() {
		return this.#dirty;
	}

	/** @type {Symbol | undefined} */
	#epochId = undefined;

	/**
	 * @param {Symbol} epochId
	 */
	markDirty = (epochId) => {
		// This is now dirtied by the epoch
		this.#epochId = epochId;
		this.#dirty = true;
		this.children.forEach((child) => {
			child.markChildrenDirty(epochId);
		});
	};

	/** @param {Symbol} epochId */
	flush = async (epochId) => {
		if (this.dirty) await this.tidy(epochId);
		await super.flush(epochId);
	};

	get mermaidName() {
		return `${this.name}>${this.name}]`;
	}
}

export class PassiveDagNode extends DagNode {
	// immutable guardrail
	get tidy() {
		return noop;
	}
	/** @type {boolean} */
	get dirty() {
		return [...this.parents].some((parent) => parent.dirty);
	}

	get mermaidName() {
		return `${this.name}[[${this.name}]]`;
	}
}

const noop = () => {};

/**
 *
 * @param {DagNode[]} nodes
 * @returns {string}
 */
export function nodesToMermaid(nodes) {
	const lines = nodes.flatMap((node) => node.toMermaid().trim().split('\n'));
	const distinctLines = new Set(lines);
	return `graph TD\n\t${Array.from(distinctLines).join('\n\t')}`;
}
