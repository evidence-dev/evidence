// TODO: Move instanceof to duck typing

/**
 * @template T
 * @typedef {import('../../usql/types.js').MaybePromise<T>}  MaybePromise
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

	markChildrenDirty = () => {
		this.children.forEach((child) => {
			if (child instanceof ActiveDagNode) {
				child.markDirty();
			}
			child.markChildrenDirty();
		});
	};

	async flush() {
		console.log(`${this.name} | Flush`);
		for (const child of this.children) {
			if (child instanceof ActiveDagNode) {
				await child.tidy();
			}

			await child.flush();
		}
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

	tidy = async () => {
		const canExec = [...this.parents].every((parent) => !parent.dirty);
		if (canExec && this.exec) this.exec();
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

	markDirty = () => {
		this.#dirty = true;
		this.children.forEach((child) => {
			child.markChildrenDirty();
		});
	};

	flush = async () => {
		await super.flush();
		this.#dirty = false;
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
    return nodes.map((node) => node.toMermaid()).join('\n');
}