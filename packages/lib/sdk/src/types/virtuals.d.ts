declare namespace Evidence {
	interface ConfigLayoutOptions {}
}

declare module '$evidence/build' {
	export const BUILD_ID: string;
	export const BUILD_DATE: Date;
}

declare module '$evidence/bootstrapContexts' {
	const fn: () => void;
	export default fn;

	export const asObj: () => Record<string, string>;
}

declare module '$evidence/contextKeys' {
	export const QUERIES_CONTEXT_KEY = '__EVIDENCE_CONTEXTUAL_QUERIES';
	export const ALL_QUERIES_CONTEXT_KEY = '__EVIDENCE_ALL_QUERIES';
	export const ALL_QUERIES_MUTS_CONTEXT_KEY = '__EVIDENCE_ALL_QUERIES_MUTS';
}

declare module '$evidence/initUsql' {
	const initUsqlPromise: Promise<void>;
	export default initUsqlPromise;
}

declare module '$evidence/ssrHook.svelte.js' {
	/**
	 * SvelteKit server hook to enable SSR
	 * @param {{name: string, queryString: string}[]} presentQueries
	 * @returns {({html: string, done: boolean}) => Promise<string>}
	 */
	export const ssrHook: (
		presentQueries: { name: string; queryString: string }[]
	) => (event: { html: string; done: boolean }) => Promise<string>;
}

declare module '$evidence/proxyStack' {
	export const ProxyStack: () => {
		value: Object;
		push: (v: Object) => string;
		rm: (id: string) => void;
	};
}

declare module '$evidence/queries' {
	type QueryResultRow = import('@evidence-dev/sdk/query-store').QueryResultRow;

	export const setSsrHookState: (installedState: boolean) => void;

	interface GetQueryResult {
		[key: string]: import('@evidence-dev/sdk/query-store').Query;
	}

	export const runQuery: <T extends QueryResultRow = QueryResult>(
		name: string,
		sql: string,
		opts?: import('@evidence-dev/sdk/query-store').QueryOpts
	) => import('@evidence-dev/sdk/query-store').QueryValue;
	export const getQueries: () => import('svelte/store').Readable<GetQueryResult>;
}

declare module '$evidence/updateQueryContext' {
	type UpdateQueryContext = () => (layerQueries: Record<string, string>) => void;
	const fn: UpdateQueryContext;
	export default fn;
}

declare module '$evidence/static-assets' {
	/**
	 * @returns Promise when running in browser, string when running in node
	 */
	export const getManifest: () => string | Promise<string>;

	export const writeInitialQueryResult: (
		queryName: string,
		routeKey: string,
		results: Array<Object>
	) => void;
	export const getInitialQueryResult: (queryName: string, routeKey: string) => Array<Object> | null;
}

declare module '$evidence/QuerySSR.svelte' {
	// I copied this from a packaged Sveltekit library and adapted it, much of this may not be required
	import { SvelteComponentTyped } from 'svelte';
	export default class QuerySSR extends SvelteComponentTyped<
		{
			queries: import('@evidence-dev/sdk/query-store').Query[];
		},
		{
			[evt: string]: CustomEvent<any>;
		},
		{
			default: {};
		}
	> {}
	export {};
}

declare module '$evidence/projectPaths' {
	export const URL_PREFIX = '_evidence' as const;

	export const inTemplate: boolean;

	export const evidenceDirectory: '..' | '.evidence';

	export const dataDirectory: string;

	export const metaDirectory: string;

	export const sourcesDirectory: string;
}
