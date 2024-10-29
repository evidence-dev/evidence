//@ts-check
/**
 * @typedef {Object} AccessTracked
 * @property {()=>void} listen
 * @property {()=>Array<string|symbol>} unlisten
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

	/**
	 * @type {AccessTracked}
	 */
	const mergeObj = {
		listen: () => {
			if (listening) {
				throw new Error(`${name ?? 'AccessTracked'} listen is already listening`);
			}
			listening = true;
		},
		unlisten: () => {
			Object.keys(mergeObj).forEach((k) => listenKeys.delete(k));
			const result = Array.from(listenKeys);
			listenKeys.clear();
			listening = false;
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
			return Array.from(new Set([...Object.keys(target), ...Object.keys(mergeObj)]));
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
			if (listening) listenKeys.add(prop);
			//@ts-expect-error Flexible proxy stuff is weird
			return target[prop];
		}
	});

	return /** @type {T & AccessTracked} */ (result);
};
