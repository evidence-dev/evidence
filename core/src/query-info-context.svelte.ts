import { getContext, setContext } from 'svelte';
import type { Query } from './Query.svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { AnyRowType } from './user-components/interfaces/query-service';
import type { ExcelSheet } from './shims/excel/workbook';
import type { ExcelFont } from './shims/excel/font';

export type QueryInfo<RowType extends AnyRowType = AnyRowType> = {
	tag: string;
	query: Query<RowType>;
	title?: string;
	/**
	 * Builds the component's styled sheet for the page Excel export, measured in the export's
	 * font; without it the raw results are exported.
	 */
	buildExcelSheet?: (font: ExcelFont) => ExcelSheet;
};

// Define a type for the query info map indexed by component ID
export type QueryInfoMap = Record<string, QueryInfo>;

// Create a writable store for the query info map
export type QueryInfoContext = {
	queryInfoMap: SvelteMap<string, QueryInfo>;
	registerQuery: <RowType extends AnyRowType>(
		componentId: string,
		tag: string,
		query: Query<RowType>,
		title?: string,
		buildExcelSheet?: (font: ExcelFont) => ExcelSheet
	) => () => void;
};

// Create a symbol key for the context
const QUERY_INFO_CONTEXT_KEY = Symbol('QUERY_INFO_CONTEXT');

// Function to create and set the context
export const setQueryInfoContext = () => {
	const queryInfoMap = new SvelteMap<string, QueryInfo>();

	const context: QueryInfoContext = {
		get queryInfoMap() {
			return queryInfoMap;
		},

		/** @returns Cleanup function to remove the query info by componentId */
		registerQuery: (componentId, tag, query, title, buildExcelSheet) => {
			queryInfoMap.set(componentId, {
				tag,
				query: query as unknown as Query<AnyRowType>,
				title,
				buildExcelSheet
			});
			return () => {
				queryInfoMap.delete(componentId);
			};
		}
	};

	setContext(QUERY_INFO_CONTEXT_KEY, context);
	return context;
};

// Function to get the context
export const getQueryInfoContext = (): QueryInfoContext | undefined => {
	const context = getContext<QueryInfoContext | undefined>(QUERY_INFO_CONTEXT_KEY);
	return context;
};
