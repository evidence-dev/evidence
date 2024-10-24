//@ts-check
/**
 * @typedef {Object} AccessTracked
 * @property {()=>()=>Array<string|symbol>} track
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
	let keys = new Set();

	/**
	 * @type {AccessTracked}
	 */
	const mergeObj = {
		track: () => {
			if (listening) {
				throw new Error(`${name ?? 'AccessTracked'} listen is already listening`);
			}
			listening = true;
			return () => {
				const result = Array.from(keys);
				keys.clear();
				listening = false;
				return result;
			};
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
			if (listening) keys.add(prop);
			return prop in target || prop in mergeObj;
		},
		get(target, prop) {
			if (prop in mergeObj) return mergeObj[prop];
			if (listening) keys.add(prop);
			//@ts-expect-error Flexible proxy stuff is weird
			return target[prop];
		}
	});

	return /** @type {T & AccessTracked} */ (result);
};
