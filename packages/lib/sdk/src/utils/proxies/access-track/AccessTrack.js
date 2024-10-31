import { nanoid } from 'nanoid';
//@ts-check
/**
 * @typedef {Object} AccessTracked
 * @property {()=>string} listen
 * @property {(tx: string, persist?: boolean)=>Array<string|symbol>} unlisten
 * @property {(keys: Array<string|symbol>)=>Array<unknown>} gather
 */

/**
 * @template {{}} T
 * @param {T} root
 * @param {string} [name]
 *
 * @returns {T & AccessTracked & Record<string | symbol, any>}
 */
export const AccessTrack = (root, name) => {
	/** @type {boolean} */
	let listening = false;
	let listenKeys = new Set();

	/** @type {Map<string, Set<string | symbol>>} */
	const listenMap = new Map();

	/**
	 * @type {AccessTracked}
	 */
	const mergeObj = {
		listen: () => {
			const tx = nanoid();
			listenMap.set(tx, new Set());
			return tx;
		},
		unlisten: (/** @type {string} */ tx, /** @type {boolean} */ persist = false) => {
			const targetSet = listenMap.get(tx);
			if (!targetSet) throw new Error('No tx found with id ' + tx);
			Object.keys(mergeObj).forEach((k) => targetSet.delete(k));
			if (!persist) listenMap.delete(tx);
			const result = Array.from(targetSet);
			return result;
		},
		gather: (keys) => {
			/** @type {Array<unknown>} */
			const out = [];
			for (const key of keys) {
				if (key in mergeObj) continue;
				out.push(root[key]);
			}
			return out;
		}
	};

	const result = new Proxy(root, {
		ownKeys(target) {
			const result = Array.from(new Set([...Object.keys(target), ...Object.keys(mergeObj)]));
			return result;
		},
		getOwnPropertyDescriptor(target, prop) {
			if (prop in mergeObj) {
				return Object.getOwnPropertyDescriptor(mergeObj, prop);
			}
			return Object.getOwnPropertyDescriptor(target, prop);
		},
		has(target, prop) {
			if (listening) listenKeys.add(prop);
			return prop in target || prop in mergeObj;
		},
		get(target, prop) {
			if (prop in mergeObj) return mergeObj[prop];
			for (const map of listenMap.values()) {
				map.add(prop);
			}
			//@ts-expect-error Flexible proxy stuff is weird
			return target[prop];
		}
	});

	return /** @type {T & AccessTracked} */ (result);
};
