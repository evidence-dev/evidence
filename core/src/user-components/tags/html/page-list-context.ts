import { getContext, setContext } from 'svelte';
import type { HtmlPageEntry } from './sandbox/html-protocol';

export type { HtmlPageEntry };

/** Lists the pages the current viewer can open; the host owns access filtering. */
export type PageListProvider = () => Promise<HtmlPageEntry[]>;

const PAGE_LIST_CONTEXT_KEY = Symbol('HTML_PAGE_LIST');

export const setPageListContext = (provider: PageListProvider): void => {
	setContext(PAGE_LIST_CONTEXT_KEY, provider);
};

export const getPageListContext = (): PageListProvider | undefined =>
	getContext<PageListProvider | undefined>(PAGE_LIST_CONTEXT_KEY);
