export function setSsrHookState(isInstalled: boolean): void;
export function runQuery(name: string, sql: string, opts?: import("@evidence-dev/sdk/query-store").QueryOpts<import("@evidence-dev/sdk/query-store").QueryResultRow> | undefined): import("@evidence-dev/sdk/query-store").QueryValue<RowType>;
export function getQueries(): import("svelte/store").Readable<Record<string, import('@evidence-dev/sdk/query-store').QueryValue>>;
export function getAllQueries(): any;
/** @deprecated Use Query instead of QueryStore */
export const QueryStore: typeof Query;
import { Query } from '@evidence-dev/sdk/query-store';
//# sourceMappingURL=queries.svelte.d.ts.map