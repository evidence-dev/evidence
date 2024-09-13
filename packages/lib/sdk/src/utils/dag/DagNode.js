// TODO: Move instanceof to duck typing
// TODO: We should track nodes that were changed during an epoch

import { nanoid } from 'nanoid';
import { storeMixin } from '../../lib/store-helpers/storeMixin.js';
/**
 * @template T
 * @typedef {import('../../usql/types.js').MaybePromise<T>} MaybePromise
 */

/**
 * @typedef {(epochId: Symbol) => MaybePromise<boolean>} ExecFn
 */

export class DagNode {
	/**
	 * @protected
	 * @type {ReturnType<typeof storeMixin<DagNode>>}
	 */
	storeMixin = storeMixin();
	subscribe = this.storeMixin.subscribe;

	/** @type {boolean} */
	get dirty() {
		throw new Error('abstract lol');
	}

	/** @type {string} */
	name;

	/** @type {unknown | undefined} */
	#container;
	get container() {
		return this.#container;
	}
	/**
	 * @param {string} name
	 * @param {unknown} [container]
	 */
	constructor(name, container) {
		this.name = name;
		this.#container = container;
		this.storeMixin.publish(this);
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

	deregisterDependencies = () => {
		this.parents.clear();
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

	/** @type {Symbol | undefined} */
	#latestEpochId = undefined;
	get latestEpochId() {
		return this.#latestEpochId;
	}

	/**
	 * @param {Symbol} epochId
	 * @deprecated "Use trigger instead"
	 * @ignore
	 */
	async flush(epochId) {
		console.log('flush', epochId, this.name);
		this.#latestEpochId = epochId;
		for (const child of this.children) {
			if (child instanceof ActiveDagNode) {
				await child.tidy(epochId);
			}

			await child.flush(epochId);
		}
		this.storeMixin.publish(this);
	}

	async trigger(includeSelf = false) {
		// Use symbol so that we only get referential equality
		const epochId = Symbol(nanoid(3));

		if (includeSelf) {
			if (this instanceof ActiveDagNode) {
				this.markDirty(epochId);
				await this.tidy(epochId);
			}
		}

		this.markChildrenDirty(epochId);
		await this.flush(epochId);
		this.storeMixin.publish(this);
	}

	get mermaidName() {
		return this.name;
	}
	get mermaidId() {
		return this.name.replaceAll(' ', '__').replaceAll(/[^\w]/g, '');
	}

	/** @returns {string} */
	toMermaid() {
		const childLines = Array.from(this.children).flatMap((child) => [
			...child.toMermaid().split('\n'),
			`${this.mermaidId} --> ${child.mermaidId}`
		]);

		return Array.from(new Set([this.mermaidName, ...childLines])).join('\n');
	}
	/**
	 * @param {DagNode} node
	 * @returns {boolean}
	 */
	hasAncestor(node) {
		if (node === this) return true;
		if (this.parents.has(node)) return true;
		if (this.parents.size === 0) return false;
		return [...this.parents].some((parent) => parent.hasAncestor(node));
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

		const canExec = parentsClean && this.#epochId === epochId && this.dirty;

		if (canExec) {
			if (!this.exec) {
				this.#dirty = false;
			} else {
				const result = await this.exec(epochId);
				if (result && this.#epochId === epochId) {
					// success
					this.#dirty = false;
				}
			}
		}
		this.storeMixin.publish(this);
	};

	/**
	 * @param {string} name
	 * @param {ExecFn} exec
	 * @param {unknown} [container]
	 */
	constructor(name, exec, container) {
		super(name, container);
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
		this.storeMixin.publish(this);
	};

	/** @param {Symbol} epochId */
	flush = async (epochId) => {
		if (this.dirty) await this.tidy(epochId);
		await super.flush(epochId);
	};

	get mermaidName() {
		return `${this.mermaidId}>"${this.name} (${this.latestEpochId?.description})"]`;
	}
}

// TODO:
export class BlockingDagNode extends DagNode {
	// immutable guardrail
	get tidy() {
		return noop;
	}

	#dirty = false;
	get dirty() {
		return this.#dirty;
	}
	unblock = () => {
		if (this.dirty) {
			this.#dirty = false;
			this.trigger();
		}
	};

	get mermaidName() {
		return `${this.mermaidId}[["${this.name} (${this.latestEpochId?.description})"]]`;
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
		return `${this.mermaidId}[["${this.name} (${this.latestEpochId?.description})"]]`;
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
