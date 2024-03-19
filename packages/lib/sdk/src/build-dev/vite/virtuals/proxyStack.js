import { nanoid } from 'nanoid';
import { derived, writable } from 'svelte/store';

/**
 * @returns {{ value: Object, push: (v: Object) => string, rm: (id: string) => void }}
 */
export const ProxyStack = () => {
	/**
	 * @type {Array<[string, Object]>}
	 */
	let stack = [];
	/** @type {import("svelte/store").Writable<Record<string,Object>>} */
	const write = writable({});

	const flush = () => {
		write.update((v) => {
			for (const k of Object.keys(v)) delete v[k];
			return Object.assign({}, v, ...stack.map((s) => s[1]));
		});
	};

	/** @param {Object} value */
	const push = (value) => {
		const id = nanoid();
		stack.push([id, value]);
		flush();
		return id;
	};

	/** @param {string} id */
	const rm = (id) => {
		stack = stack.filter(([itemId]) => itemId !== id);
		flush();
	};

	return { value: derived([write], ([$write]) => $write), push, rm };
};
