/// <reference types="types/mosaic-sql.js" />
import type { Query as QueryBuilder } from '@uwdata/mosaic-sql';
import type { DescribeResultRow } from '../types/duckdb-wellknown.d.ts';
import type { QueryValue } from './Query.js';
export type EventEmitter<Events extends Record<string, any> = {}> = {
    addEventListener<Event extends keyof Events>(event: Event, handler: (value: Events[Event]) => void): void;
    removeEventListener<Event extends keyof Events>(event: Event, handler: (value: Events[Event]) => void): void;
    on<Event extends keyof Events>(event: Event, handler: (value: Events[Event]) => void): void;
    off<Event extends keyof Events>(event: Event, handler: (value: Events[Event]) => void): void;
};
export type EventMap<Events extends Record<string, any>> = {
    [Event in keyof Events]: Set<(v: Events[Event]) => void>;
};
export type QueryResultRow = Record<string, number | string | Date | boolean | null>;
export type MaybePromise<T> = Promise<T> | T;
export type Runner<RowType extends QueryResultRow = QueryResultRow> = (query: string, query_name: string) => MaybePromise<RowType[]>;
export type Subscriber<T> = (value: T) => unknown;
export type QueryOpts<RowType extends QueryResultRow = QueryResultRow> = {
    initialData?: RowType[];
    knownColumns?: DescribeResultRow[];
    initialError?: Error;
    id?: string;
    disableCache?: boolean;
    /**
     * When true, this prevents the query from ever fetching or presenting data.
     **/
    noResolve?: boolean;
};
export interface CreateQuery<RowType extends QueryResultRow = QueryResultRow> {
    (query: QueryBuilder | string, executeQuery: Runner, opts: QueryOpts<RowType>, _?: never): QueryValue<RowType>;
    /**
     * @deprecated id has been moved to the options argument
     */
    (query: QueryBuilder | string, executeQuery: Runner, id?: string, opts?: Omit<QueryOpts<RowType>, 'id'>): QueryValue<RowType>;
}
//# sourceMappingURL=types.d.ts.map