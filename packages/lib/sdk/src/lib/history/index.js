import { detailedDiff } from 'deep-object-diff';

/** @typedef {import("./types.js").Diff} Diff */

/**
 * @template {Object} [T=any]
 */
export class History {
	/** @type {Diff[]} */
	#history = [];
	get generations() {
		return [...this.#history];
	}
	constructor() {}

	/** @type {T | {}} */
	#prev = {};
	/**
	 * @param {T} value
	 */
	push(value) {
		/** @param {Object} o */
		const organize = (o) => {
			if (Array.isArray(o)) return JSON.parse(JSON.stringify(o)); // no sorting
			if (!o) return {};
			let entries = Object.entries(o);
			entries.sort((a, b) => a[0].localeCompare(b[0]));
			// @ts-ignore
			const newObject = Object.fromEntries(entries);
			return JSON.parse(JSON.stringify(newObject));
		};

		const pre = organize(this.#prev);
		const post = organize(value);
		const diff = detailedDiff(pre, post);
		if (
			Object.keys(diff.added).length === 0 &&
			Object.keys(diff.deleted).length === 0 &&
			Object.keys(diff.updated).length === 0
		) {
			if (Array.isArray(pre) !== Array.isArray(post)) {
				this.#prev = post;
				this.#history.push({
					...diff,
					before: pre,
					after: post,
					asof: new Date()
				});
			}
			this.publish();
			return;
		}
		this.#history.push({
			...diff,
			before: pre,
			after: post,
			asof: new Date()
		});
		this.#prev = post;
		this.publish();
	}

	////////////////////////////////////
	/// < Implement Store Contract > ///
	////////////////////////////////////
	/** @type {Set<(v: Diff[]) => void>} */
	#subscribers = new Set();

	/**
	 * @param {(v: Diff[]) => void} fn
	 * @returns {() => void} Unsubscribe function
	 */
	subscribe = (fn) => {
		this.#subscribers.add(fn);
		fn(this.generations);
		return () => this.#subscribers.delete(fn);
	};

	#publishIdx = 0;
	/**
	 * @protected
	 */
	publish = () => {
		if (this.#publishIdx++ > 100000) throw new Error('History published too many times.');
		this.#subscribers.forEach((fn) => fn(this.generations));
	};
	//////////////////////////////////////
	/// </ Implement Store Contract /> ///
	//////////////////////////////////////
}
