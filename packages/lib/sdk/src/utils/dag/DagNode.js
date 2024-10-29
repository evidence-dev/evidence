// TODO: We should track nodes that were changed during an epoch

import { nanoid } from 'nanoid';
import { storeMixin } from '../../lib/store-helpers/storeMixin.js';
import {
	resolveMaybePromise,
	resolveMaybePromises
} from '../../usql/utilities/resolveMaybePromise.js';

/**
 * @template T
 * @typedef {import('../../usql/types.js').MaybePromise<T>} MaybePromise
 */

/**
 * @typedef {(fn: () => void) => void} DeferralCallback
 */

/**
 * @typedef {(epochId: Symbol, defer: DeferralCallback) => MaybePromise<boolean>} ExecFn
 */

export class DagNode {
	#id = nanoid(4);
	get id() {
		return this.#id;
	}

	/**
	 * @protected
	 * @type {ReturnType<typeof storeMixin<DagNode>>}
	 */
	storeMixin = storeMixin();
	subscribe = this.storeMixin.subscribe;

	/** @type {boolean} */
	get dirty() {
		throw new Error('Dirty must be implemented in a subclass');
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

	#hidden = false;
	set hidden(value) {
		this.#hidden = value;
		this.storeMixin.publish(this);
	}

	get hidden() {
		return this.#hidden;
	}

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
		if (typeof dep !== 'object') {
			console.debug(`DagNode: Ignoring ${dep} as it is not an object`);
			return;
		}

		// Names should be unique, if we have the same name duplicated but are failing
		// referential equality, then something is screwy (probably hmr)
		const existingParent = [...this.parents.values()].find((d) => d.name === dep.name);
		if (existingParent) {
			this.parents.delete(existingParent);
			existingParent.children.delete(this);
		}

		const imposter = [...(dep?.children ?? [])].find((d) => d.name === this.name);
		if (imposter) {
			dep.children.delete(imposter);
		}
		this.parents.add(dep);
		dep.children.add(this);
		this.storeMixin.publish(this);
		return true;
	};

	/** @param {DagNode} dep */
	deregisterDependency = (dep) => {
		if (!dep) return;
		this.parents.delete(dep);
		dep.children.delete(this);
		this.storeMixin.publish(this);
	};

	deregisterDependencies = () => {
		this.parents.forEach((parent) => parent.children.delete(this));
		this.parents.clear();
		this.storeMixin.publish(this);
	};

	/**
	 * @param {Symbol} epochId
	 */
	markChildrenDirty = (epochId) => {
		this.children.forEach((child) => {
			child.markDirty(epochId);
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
	 * @param {DeferralCallback} deferCallback
	 * @deprecated "Use trigger instead"
	 * @ignore
	 */
	flush(epochId, deferCallback) {
		this.#latestEpochId = epochId;
		resolveMaybePromises(
			() => this.storeMixin.publish(this),
			Array.from(this.children).map((child) => child.flush(epochId, deferCallback))
		);
		// for (const child of this.children) {
		// 	// 🚩 is this the behavior that we want?
		// 	// await child.tidy(epochId, deferCallback);
		// 	await child.flush(epochId, deferCallback);
		// }
		this.storeMixin.publish(this);
	}

	trigger = (includeSelf = false) => {
		// Use symbol so that we only get referential equality
		const epochId = Symbol(nanoid(3));
		/** @type {Set<Parameters<DeferralCallback>[0]>} */
		const deferrals = new Set();
		const deferCallback = (/** @type {Parameters<DeferralCallback>[0]} */ fn) => {
			if (typeof fn !== 'function') throw new Error('Cannot defer non-function');
			deferrals.add(fn);
		};

		const flush = () => {
			if (includeSelf) {
				this.markDirty(epochId);
			}
			this.markChildrenDirty(epochId);
			resolveMaybePromise(
				() => {
					this.storeMixin.publish(this);
				},
				this.flush(epochId, deferCallback)
			);
		};

		resolveMaybePromise(() => {
			deferrals.forEach((fn) => {
				fn();
			});
		}, flush());

		return epochId;
	};

	get mermaidName() {
		return this.name;
	}
	get mermaidId() {
		return this.name.replaceAll(' ', '__').replaceAll(/[^\w]/g, '');
	}

	/** @returns {string} */
	toMermaid() {
		const childLines = Array.from(this.children)
			.filter((n) => n.name !== 'InputStore')
			.flatMap((child) => [
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

	/**
	 * @type {(epochId: Symbol, defer: DeferralCallback) => void}
	 */
	tidy = () => {
		this.storeMixin.publish(this);
	};

	/** @type {(epochId: Symbol) => void} */
	markDirty = noop;

	/** @param {unknown} container */
	updateContainer = (container) => {
		this.#container = container;
	};

	['🦆'] = '__EvidenceDagNode__';

	/**
	 * @param {unknown} v
	 * @returns {v is DagNode}
	 */
	static isDagNode(v) {
		if (!v || typeof v !== 'object') return false;
		return '🦆' in v && v['🦆'] === '__EvidenceDagNode__';
	}
}
// ??
export class ActiveDagNode extends DagNode {
	/** @type {ExecFn} */
	exec;

	tidy =
		/**
		 * @param {Symbol} epochId
		 * @param {DeferralCallback} defer
		 */
		(epochId, defer) => {
			const parentsClean = [...this.parents].every((parent) => !parent.dirty);

			const canExec = parentsClean && this.#epochId === epochId && this.dirty;

			if (canExec) {
				if (!this.exec) {
					this.#dirty = false;
				} else {
					resolveMaybePromise(
						(result) => {
							this.prevTidyPromise = result;

							if (result && this.#epochId === epochId) {
								// success
								this.#dirty = false;
							}
						},
						this.exec(epochId, defer)
					);
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

	/**
	 * @param {Symbol} epochId
	 * @param {DeferralCallback} defer
	 */
	flush = (epochId, defer) => {
		return resolveMaybePromise(
			() => {
				super.flush(epochId, defer);
			},
			this.tidy(epochId, defer)
		);
	};

	get mermaidName() {
		return `${this.mermaidId}>"${this.name} (${this.latestEpochId?.description})"]`;
	}
}

// TODO:
export class BlockingDagNode extends DagNode {
	#dirty = false;
	get dirty() {
		return this.#dirty;
	}

	tidy = () => this.unblock();
	markDirty = () => {
		this.#dirty = true;
	};
	unblock = () => {
		if (this.dirty) {
			this.#dirty = false;
			this.storeMixin.publish(this);
			return this.trigger();
		}
	};

	get mermaidName() {
		return `${this.mermaidId}[["${this.name} (${this.latestEpochId?.description})"]]`;
	}
}

export class PassiveDagNode extends DagNode {
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
	const targetNodes = nodes.filter((node) => node.name !== 'InputStore');
	const lines = targetNodes.flatMap((node) => node.toMermaid().trim().split('\n'));
	const distinctLines = new Set(lines);
	return `graph TD\n\t${Array.from(distinctLines).join('\n\t')}`;
}
