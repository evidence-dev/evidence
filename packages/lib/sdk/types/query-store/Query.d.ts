/// <reference types="types/mosaic-sql.js" />
/**
 * @typedef {import("./types.js").QueryResultRow} QueryResultRow
 */
/**
 * @template T
 * @typedef {import('./types.js').MaybePromise<T>} MaybePromise
 */
/**
 * @template {QueryResultRow} RowType
 * @typedef  {import('../lib/sharedPromise.js').SharedPromise<Query<RowType>>} ChainableSharedPromise
 */
/**
 * @template {QueryResultRow[]} RowType
 * @typedef {import("svelte/store").Readable<RowType>} Readable
 */
/**
 * @template {QueryResultRow} [RowType=QueryResultRow]
 * @typedef {RowType[] & Query<RowType>} QueryValue
 */
/**
 * @typedef {Object} QueryEvents<RowType>
 * @property {undefined} dataReady
 * @property {number} highScore
 * @property {Error} error
 */
/**
 * @typedef {import('./types.js').EventEmitter<QueryEvents>} QueryEventEmitter
 */
/**
 * @class
 * @template {QueryResultRow} [RowType=QueryResultRow]
 * @implements {Query<RowType>}
 * @implements {Readable<QueryValue<RowType>>}
 * @implements {QueryEventEmitter}
 */
export class Query<RowType extends import("./types.js").QueryResultRow = import("./types.js").QueryResultRow> implements Query<RowType>, Readable<QueryValue<RowType>>, QueryEventEmitter {
    /**
     * @template {QueryResultRow} RowType
     * @param {unknown} q
     * @returns {q is Query<RowType>}
     */
    static isQuery: <RowType_2 extends import("./types.js").QueryResultRow>(q: unknown) => q is Query<RowType_2>;
    /** @type {string[]} */
    static get ProxyFetchTriggers(): string[];
    static "__#2@#cache": Map<any, any>;
    /**
     * @template {QueryResultRow} [RowType=QueryResultRow]
     * @type {import("./types.js").CreateQuery<RowType>}
     * @returns {QueryValue<RowType>}
     */
    static create: import("./types.js").CreateQuery<RowType_1>;
    static "__#2@#constructing": boolean;
    /** @param {unknown} v */
    static [Symbol.hasInstance](v: unknown): boolean;
    /**
     * @param {QueryBuilder | string} query
     * @param {import('./types.js').Runner} executeQuery
     * @param {import("./types.js").QueryOpts<RowType>} opts
     * @deprecated Use {@link Query.create} instead
     */
    constructor(query: QueryBuilder | string, executeQuery: import('./types.js').Runner, opts?: import("./types.js").QueryOpts<RowType>);
    get value(): QueryValue<RowType>;
    get dataLoaded(): boolean;
    get dataLoading(): boolean;
    get length(): number;
    get lengthLoaded(): boolean;
    get lengthLoading(): boolean;
    get columns(): import("../types/duckdb-wellknown.js").DescribeResultRow[];
    get columnsLoaded(): boolean;
    get columnsLoading(): boolean;
    /**
     * True when data, length, and columns have all been fetched
     */
    get ready(): boolean;
    /**
     * True when data, length, or columns are currently being fetched
     */
    get loading(): boolean;
    get error(): Error | undefined;
    /**
     * The Query text as is was provided
     */
    get originalText(): string;
    /**
     * The Query text as it is being executed
     */
    get text(): string;
    fetch: () => MaybePromise<Query<RowType>>;
    /**
     * @ignore
     * @private
     */
    private get isQuery();
    /** @type {string} */
    get id(): string;
    /** @type {string} */
    get hash(): string;
    /** @type {import('./types.js').QueryOpts} */
    opts: import('./types.js').QueryOpts;
    /**
     * @param {import('./types.js').Subscriber<QueryValue<RowType>>} fn
     * @returns {() => void} Unsubscribe function
     */
    subscribe: (fn: import('./types.js').Subscriber<QueryValue<RowType>>) => () => void;
    /**
     * @protected
     */
    protected publish: (source: string) => void;
    /**
     * @template {keyof QueryEvents} Event
     * @param {Event} event
     * @param {(v: QueryEvents[Event]) => void} handler
     */
    on: <Event extends keyof QueryEvents>(event: Event, handler: (v: QueryEvents[Event]) => void) => void;
    /**
     * @template {keyof QueryEvents} Event
     * @param {Event} event
     * @param {(v: QueryEvents[Event]) => void} handler
     */
    off: <Event_1 extends keyof QueryEvents>(event: Event_1, handler: (v: QueryEvents[Event_1]) => void) => void;
    addEventListener: <Event extends keyof QueryEvents>(event: Event, handler: (v: QueryEvents[Event]) => void) => void;
    removeEventListener: <Event_1 extends keyof QueryEvents>(event: Event_1, handler: (v: QueryEvents[Event_1]) => void) => void;
    /** @param {string} filterStatement */
    where: (filterStatement: string) => QueryValue<RowType_1>;
    /** @param {number} limit */
    limit: (limit: number) => QueryValue<RowType_1>;
    /** @param {number} offset */
    offset: (offset: number) => QueryValue<RowType_1>;
    /**
     * @param {number} offset
     * @param {number} limit
     */
    paginate: (offset: number, limit: number) => QueryValue<RowType_1>;
    #private;
}
export function hashQuery(...args: any[]): string;
export type QueryResultRow = import("./types.js").QueryResultRow;
export type MaybePromise<T> = import('./types.js').MaybePromise<T>;
export type ChainableSharedPromise<RowType extends import("./types.js").QueryResultRow> = import('../lib/sharedPromise.js').SharedPromise<Query<RowType>>;
export type Readable<RowType extends import("./types.js").QueryResultRow[]> = import("svelte/store").Readable<RowType>;
export type QueryValue<RowType extends import("./types.js").QueryResultRow = import("./types.js").QueryResultRow> = RowType[] & Query<RowType>;
/**
 * <RowType>
 */
export type QueryEvents = {
    dataReady: undefined;
    highScore: number;
    error: Error;
};
export type QueryEventEmitter = import('./types.js').EventEmitter<QueryEvents>;
import { Query as QueryBuilder } from '@uwdata/mosaic-sql';
//# sourceMappingURL=Query.d.ts.map