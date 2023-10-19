import { dev } from '$app/environment';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Persist ShowQueries user choice
export const showQueries = writable(
	dev && browser && localStorage.getItem('showQueries') != 'false'
);
showQueries.subscribe((value) => browser && localStorage.setItem('showQueries', value));
export const pageHasQueries = writable(true);
export const routeHash = writable('');

function createToastsObject() {
	const { subscribe, update } = writable([]);

	return {
		subscribe,
		add: (toast, timeout) => {
			console.log({toast, timeout})
			update(($toasts) => ($toasts.push(toast), $toasts));
			setTimeout(() => {
				update(($toasts) => $toasts.filter((existing) => existing.id !== toast.id));
			}, timeout);
		}
	};
}

/** @typedef {{ id: unknown; style?: string; title: string; message: string; }} Toast */
/** @type {import('svelte/store').Readable<Toast[]> & { add: (toast: Toast, timeout: number) => void }} */
export const toasts = createToastsObject();
