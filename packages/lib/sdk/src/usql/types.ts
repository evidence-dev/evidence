import type { Query as QueryBuilder } from '@uwdata/mosaic-sql';
// This file has a .ts instead of .d.ts to ensure that it is included in the built types.
// It should not be used as anything other than a .d.ts file
import type { DescribeResultRow } from '../types/duckdb-wellknown.d.ts';
import type { ChainableSharedPromise, Query, QueryValue } from './query/Query.js';

export type EventHandler<
	Events extends Record<string, any> = {},
	Event extends keyof Events = keyof Events
> = (value: Events[Event], event: Event) => void;

export type EventEmitter<Events extends Record<string, any> = {}> = {
	addEventListener<Event extends keyof Events>(event: Event, handler: EventHandler<Events>): void;
	removeEventListener<Event extends keyof Events>(
		event: Event,
		handler: EventHandler<Events>
	): void;
	on<Event extends keyof Events>(event: Event, handler: EventHandler<Events>): void;
	off<Event extends keyof Events>(event: Event, handler: EventHandler<Events>): void;
};

export type EventMap<Events extends Record<string, any>> = {
	[Event in keyof Events]: Set<EventHandler<Events, Event>>;
};

export type QueryResultRow = Record<string, number | string | Date | boolean | null>;
export type MaybePromise<T> = Promise<T> | T;

export type Runner<RowType extends QueryResultRow = QueryResultRow> = (
	query: string,
	query_name: string
) => MaybePromise<RowType[]>;
export type Subscriber<T> = (value: T) => unknown;

export type QueryOpts<RowType extends QueryResultRow = QueryResultRow> = {
	initialData?: RowType[];
	/**
	 * @deprecated Use Query.reactive instead
	 */
	initialDataDirty?: boolean;

	knownColumns?: DescribeResultRow[];

	initialError?: Error;
	id?: string;
	disableCache?: boolean;
	autoScore?: boolean;
	/**
	 * When true, this prevents the query from ever fetching or presenting data.
	 **/
	noResolve?: boolean;
};

export type QueryReactivityOpts<T extends QueryResultRow = QueryResultRow> = {
	loadGracePeriod?: number;
	callback: (v: QueryValue<T>) => void;
	execFn: Runner<T>;
};

export interface CreateQuery<RowType extends QueryResultRow = QueryResultRow> {
	(
		query: QueryBuilder | string,
		executeQuery: Runner,
		opts: QueryOpts<RowType>,
		_?: never
	): QueryValue<RowType>;

	/**
	 * @deprecated id has been moved to the options argument
	 */
	(
		query: QueryBuilder | string,
		executeQuery: Runner,
		id?: string,
		opts?: Omit<QueryOpts<RowType>, 'id'>
	): QueryValue<RowType>;
}

export type LengthResultRow = { rowCount: number };

export type MaybeAliasedCol = string | { col: string; as: string };

export type QueryDebugPayload = {
	raw: Query<any>;
	proxied: QueryValue<any>;
};
