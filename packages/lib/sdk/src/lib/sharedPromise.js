/**
 * @template [ResolveType=unknown]
 * @typedef {Object} SharedPromise
 * @property {Promise<ResolveType>} promise
 * @property {(v: ResolveType) => unknown} resolve
 * @property {(e: Error) => unknown} reject
 * @property {'init' | 'loading' | 'resolved' | 'rejected'} state
 * @property {ResolveType | null} value
 * @property {() => void} start
 **/

/**
 * @template [ResolveType=void]
 * @param {() => void} [stateChangeHook]
 * @returns {SharedPromise<ResolveType>}
 */
export const sharedPromise = (stateChangeHook) => {
	/** @type {((v: ResolveType) => unknown) | null} */
	let res = null;
	/** @type {((e: Error) => unknown) | null} */
	let rej = null;
	/** @type {Promise<ResolveType>} */
	const p = new Promise((a, b) => {
		res = a;
		rej = b;
	});

	/** @type {'init' | 'loading' | 'resolved' | 'rejected'} */
	let state = 'init';

	/**
	 * @type {ResolveType | null}
	 */
	let resolvedValue = null;

	if (!res || !rej) throw new Error();
	return {
		promise: p,
		/**
		 * @param {ResolveType} v
		 */
		resolve: (v) => {
			if (res) {
				if (state === 'loading' || state === 'init') {
					state = 'resolved';
					resolvedValue = v;
					res(v);
					stateChangeHook?.();
				}
			} else throw new Error('SharedPromise encountered an error: res not defined');
		},
		/**
		 *
		 * @param {Error} e
		 */
		reject: (e) => {
			if (rej) {
				if (state === 'loading' || state === 'init') {
					state = 'rejected';
					p.catch(() => {}); // noop to prevent the page from dying. This does not prevent .catch from working in other places
					rej(e);
					stateChangeHook?.();
				}
			} else throw new Error('SharedPromise encountered an error: rej not defined');
		},
		get state() {
			return state;
		},
		get value() {
			return resolvedValue;
		},
		start() {
			state = 'loading';
			stateChangeHook?.();
		}
	};
};
