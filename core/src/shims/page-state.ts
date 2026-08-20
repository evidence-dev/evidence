/**
 * Page state shim - replaces $app/state's page store.
 * Provides a reactive page object that can be configured.
 */

import { getContext, setContext } from 'svelte';

const PAGE_STATE_KEY = Symbol('page-state');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PageData = Record<string, any>;

interface PageState {
	data: PageData;
	url: URL;
	params: Record<string, string>;
	route: { id: string | null };
	status: number;
	error: Error | null;
	form: unknown;
}

let _pageState: PageState = {
	data: {},
	url: typeof window !== 'undefined' ? new URL(window.location.href) : new URL('http://localhost'),
	params: {},
	route: { id: null },
	status: 200,
	error: null,
	form: null
};

/**
 * The page state object - mimics SvelteKit's page store.
 * In CLI/non-SvelteKit contexts, use setPageState to configure.
 */
export const page = {
	get data() {
		return _pageState.data;
	},
	get url() {
		return _pageState.url;
	},
	get params() {
		return _pageState.params;
	},
	get route() {
		return _pageState.route;
	},
	get status() {
		return _pageState.status;
	},
	get error() {
		return _pageState.error;
	},
	get form() {
		return _pageState.form;
	}
};

/**
 * Set the page state - used by CLI/non-SvelteKit consumers.
 */
export function setPageState(state: Partial<PageState>): void {
	_pageState = { ..._pageState, ...state };
}

/**
 * Set page data specifically.
 */
export function setPageData(data: PageData): void {
	_pageState.data = data;
}

/**
 * Context-based page state for component trees.
 */
export function setPageStateContext(state: PageState): void {
	setContext(PAGE_STATE_KEY, state);
}

export function getPageStateContext(): PageState | undefined {
	return getContext<PageState | undefined>(PAGE_STATE_KEY);
}
