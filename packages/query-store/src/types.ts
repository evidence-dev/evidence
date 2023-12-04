import type { QueryStore } from './QueryStore';
import type { Query } from '@uwdata/mosaic-sql';

export type Subscriber<T> = (value: T) => unknown;

export type MaybePromise<T> = Promise<T> | T;

export type Runner = (query: string, query_name: string) => MaybePromise<QueryResult[]>;

export type AggFunction = (query: Query, ...args: any[]) => Query;

export type QueryResult = Record<string, number | string | Date | boolean | null>;
export type ColumnMetadata = { name: string; type: string };
export type QueryStoreOpts = {
	disableCache?: boolean;
	/** If the query has already been run, provide an initial dataset to prevent flicker */
	initialData?: QueryResult[] | Promise<QueryResult[]>;
	/** If the initial data may be outdated, or belongs to the previous store (e.g. on pagination), refetch when needed */
	initialDataDirty?: boolean;
	/** If there was an error when getting the initial data; this store should start in an error state */
	initialError?: Error;
	/** Optional hook to enable custom error reporting behavior, can be used for toasts, alerts, etc. */
	errorNotifier?: (error: Error) => unknown;
	/** Optional hook to enable custom query score behavior, can be used for toasts, alerts, etc. */
	scoreNotifier?: (info: ScoreInformation) => void;
};

export type ScoreInformation = {
	id: string;
	query: string;
	score: number;
};

export type QueryStoreValue = QueryStore & QueryResult[];
