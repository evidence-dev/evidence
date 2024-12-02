import { dev } from '$app/environment';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const pageHasQueries = writable(true);
export const routeHash = writable('');

function createToastsObject() {
	const { subscribe, update } = writable([]);

	const timeoutMap = new Map();

	const removeToast = (id) => {
		update(($toasts) => $toasts.filter((existing) => existing.id !== id));
	};

	return {
		subscribe,
		/**
		 *
		 * @param {Toast} toast
		 * @param {number} [timeout]
		 */
		add: (toast, timeout = 2000) => {
			// Totally safe ids
			toast.id = toast.id ?? Math.random().toString();
			update(($toasts) => {
				const existing = $toasts.find((t) => t.id === toast.id);
				if (existing) {
					Object.assign(existing, toast);
					if (timeoutMap.has(toast.id)) {
						clearTimeout(timeoutMap.get(toast.id));
						timeoutMap.delete(toast.id);
					}
				} else {
					$toasts.push(toast);
				}
				return $toasts;
			});
			if (timeout) {
				const timeoutId = setTimeout(() => {
					removeToast(toast.id);
					timeoutMap.delete(toast.id);
				}, timeout);
				timeoutMap.set(toast.id, timeoutId);
			}
		},
		dismiss: (toastId) => {
			removeToast(toastId);
			if (timeoutMap.has(toastId)) {
				clearTimeout(timeoutMap.get(toastId));
				timeoutMap.delete[toastId];
			}
		}
	};
}

/** @typedef {"error" | "warning" | "success" | "info"} ToastStatus */
/** @typedef {{ id: string; status?: ToastStatus; title: string; message: string; }} Toast */
/** @type {import('svelte/store').Readable<Toast[]> & { add: (toast: Toast, timeout: number) => void }} */
export const toasts = createToastsObject();

/**
 * @template T
 * @param {import('svelte/store').Readable<T>} store
 * @returns {T}
 */
const getStoreVal = (store) => {
	let v;
	store.subscribe((x) => (v = x))();
	return v;
};

/**
 * Implementation of a writable store that also saves it's values to localStorage
 * @template T
 * @param {string} key localStorage key
 * @param {T} init
 * @returns {Writable<T>}
 */
export const localStorageStore = (key, init) => {
	const store = writable(browser ? (JSON.parse(localStorage.getItem(key)) ?? init) : init);
	const { subscribe, set } = store;

	/** @type {(v: T) => void} */
	const flush = (v) => {
		if (browser) {
			if (typeof v === 'undefined' || v === null) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, JSON.stringify(v));
			}
		}
	};

	flush(getStoreVal(store));

	/** @type {Writable<T>} */
	return {
		subscribe,
		set: (v) => {
			set(v);
			flush(v);
		},
		update: (cb) => {
			const updatedStore = cb(getStoreVal(store));
			set(updatedStore);
			flush(updatedStore);
		}
	};
};

// Persist ShowQueries user choice
export const showQueries = localStorageStore('showQueries', dev && browser);
