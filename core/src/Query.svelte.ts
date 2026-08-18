import type {
	AnyRowType,
	QueryResult,
	QueryService
} from './user-components/interfaces/query-service';
import type { SQLQueryConfig } from './user-components/common/sql-options';
import {
	generateSQLQuery,
	processFilterIds,
	generateGroupingSets,
	generateSubtotalHelperColumns,
	quoteUntrustedIdentifierPath,
	resolveTableExpressionName
} from './user-components/common/sql-options';
import type { Filters } from './Filters.svelte';
import { extract, resource, type MaybeGetter, type ResourceReturn } from 'runed';
import { rawResource } from './rawResource.svelte';
import {
	buildPivotResultSizeLowerBoundQuery,
	type PivotResultSizeLowerBoundQueryResultRow
} from './user-components/common/buildPivotResultSizeLowerBoundQuery/buildPivotResultSizeLowerBoundQuery';
import defaults from 'lodash/defaults';
import type { InlineQueries } from './user-components/common/inline-queries';
// posthog is only initialized in Evidence Studio; these captures no-op in the CLI.
import posthog from 'posthog-js';
import { browser } from './shims/env';
import { enrichWarehouseError } from './connectors/enrich-warehouse-error';
import type { ProjectSettings } from './user-components/interfaces/project-settings';
import { DEFAULT_PROJECT_SETTINGS } from './user-components/interfaces/project-settings';
import { parseDateStringAsLocalMidnight } from './utils/date-utils';
import { processDateRange } from './user-components/common/date-options';
import { watch } from 'runed';
import { logger } from './shims/logger';

// NOTE: When adding fields to this object, use `| undefined` rather than `?` to make a property optional. This
// makes it so that dependencies must be explicitly ommitted rather than forgotten, resulting in more intentful usage.
export type QueryDependencies = {
	queryService: QueryService;
	filterContexts: (Filters | undefined)[] | undefined;
	inlineQueries: InlineQueries | undefined;
	projectSettings:
		| MaybeGetter<ProjectSettings & { computedDefaultDateRangeEnd?: string }>
		| undefined;
	/** Page-level auto-refresh interval in seconds (0 or undefined = disabled). Used as fallback when no component-level refresh_interval is set. */
	defaultRefreshInterval: MaybeGetter<number | undefined> | undefined;
};

export type QueryOptions = {
	count: boolean;
	debounce: number;
	exceedRowLimitBehavior: 'paginate' | 'sample';
	noCache?: boolean;
	/** Component-level refresh interval in seconds. Overrides the page-level default. */
	refreshInterval?: MaybeGetter<number | undefined>;
	/**
	 * Highest explicit `limit` this query will honor before falling back to
	 * sampling. Defaults to `MAX_USER_LIMIT` (10k). Carved out per-query so the
	 * map can pull the tens-of-thousands of raw points a WebGL layer needs
	 * without lifting the ceiling for tables/charts. See `MAP_POINT_ROW_LIMIT`.
	 */
	maxUserLimit?: number;
};

export type SerializedQuery<RowType extends AnyRowType = AnyRowType> = {
	data?: Query<RowType>['dataResource']['current'];
	count?: Query<RowType>['countResource']['current'];
	maxDate?: Query<RowType>['maxDateResource']['current'];
};

type QueryDebugInfo =
	| { checkType: 'none'; finalDecision?: 'client' | 'server' }
	| {
			checkType: 'non-pivot';
			rowsReturned: number;
			finalDecision: 'client' | 'server';
	  }
	| {
			checkType: 'pivot';
			pivotCheckExceedsLowerBound: boolean;
			pivotCheckExceedsColumnLimit: boolean;
			estimatedColumns?: number;
			userLimit: number | undefined;
			paginationDecision: 'client' | 'server';
			finalDecision?: 'client' | 'server';
			renderingDecision?: 'pivots_as_dimensions' | 'normal_pivot';
	  };

const defaultOptions: QueryOptions = {
	count: false,
	debounce: 500,
	exceedRowLimitBehavior: 'sample',
	noCache: false
};

const PIVOT_ROW_LIMIT = 100000;
const NON_PIVOT_ROW_LIMIT = 2000;
const MAX_USER_LIMIT = 10000; // Respect user limits up to 10k
const PIVOT_COLUMN_LIMIT = 500; // Max columns before treating pivots as dimensions

export class Query<RowType extends AnyRowType = AnyRowType> {
	/** Registry of all active Query instances for cache export */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static readonly activeQueries = new Set<Query<any>>();

	/**
	 * Export current SQL→result pairs from all active Query instances.
	 * Only includes queries that have completed successfully.
	 */
	static exportActiveResults(): Array<
		[string, { rows: unknown[]; columns: unknown[]; error: null }]
	> {
		const entries: Array<[string, { rows: unknown[]; columns: unknown[]; error: null }]> = [];
		const seen = new Set<string>();
		for (const query of Query.activeQueries) {
			const sql = query.sql;
			const result = query.result;
			if (sql && result && !result.error && !seen.has(sql)) {
				seen.add(sql);
				entries.push([sql, { rows: result.rows, columns: result.columns, error: null }]);
			}
		}
		return entries;
	}

	/**
	 * Force every active Query instance to refetch with `noCache: true`. Used by
	 * the Snowflake schema picker to flush stale rows without reloading the page.
	 */
	static refreshAll(): void {
		for (const query of Query.activeQueries) {
			query.refresh();
		}
	}

	private readonly options: QueryOptions;
	// runed's debounced resource doesn't cancel its timeout or abort the signal
	// at teardown, so a fetcher can run after the component is gone — reading dead
	// deriveds (derived_inert) and firing queries for charts that no longer exist.
	// Every fetcher checks this on entry and after each await. Not $state: it's
	// read from async callbacks, not tracked by effects.
	private _destroyed = false;
	// Tracks when query changes to immediately show loading state (prevents choppy chart transitions)
	private _manualLoading = $state(false);
	// Counter to force refresh - incrementing this triggers a refetch
	private _refreshCounter = $state(0);
	// When true, a background refresh is in progress — suppresses the loading state
	private _isRefreshing = $state(false);

	constructor(
		private readonly queryGetter: () => string | SQLQueryConfig | undefined,
		private readonly deps: QueryDependencies,
		options?: Partial<QueryOptions>,
		serialized?: SerializedQuery<RowType>
	) {
		this.options = defaults({}, options, defaultOptions);
		const { count, debounce, exceedRowLimitBehavior } = this.options;

		// Register in active set; clean up when owning component is destroyed.
		// Both add and delete are inside $effect so they're always paired —
		// if $effect can't run (SSR, tests), the Set is never mutated.
		$effect(() => {
			Query.activeQueries.add(this);
			return () => {
				Query.activeQueries.delete(this);
				this._destroyed = true;
			};
		});

		// Immediately set loading when query changes (smoother chart transitions)
		// Also clear _isRefreshing so genuine query changes (filter/attribute) show loading properly
		watch(
			() => this.queryGetter(),
			() => {
				this._isRefreshing = false;
				this._manualLoading = true;
			}
		);

		// Reset loading flags once resource completes (including cache hits)
		$effect(() => {
			const dataHasExecuted =
				typeof this.dataResource.error !== 'undefined' ||
				typeof this.dataResource.current !== 'undefined';

			if (dataHasExecuted && !this.dataResource.loading) {
				this._manualLoading = false;
				this._isRefreshing = false;
			}
		});

		// Self-rearming refresh timer: after each query completes, wait `interval` seconds then refresh.
		// This naturally staggers queries across components since each timer starts after ITS query finishes.
		$effect(() => {
			// Determine effective interval: component-level > page-level > disabled
			const componentInterval = extract(this.options.refreshInterval);
			const pageInterval = extract(this.deps.defaultRefreshInterval);
			const rawInterval = componentInterval ?? pageInterval ?? 0;
			// Hard floor: never refresh faster than once per 30s (protects ClickHouse).
			const interval = rawInterval > 0 ? Math.max(rawInterval, 30) : 0;

			const hasData = typeof this.dataResource.current !== 'undefined';
			const hasError = typeof this.dataResource.error !== 'undefined';
			const isLoading = this.dataResource.loading;

			// Don't re-arm after errors — prevents hammering ClickHouse with failing queries
			if (interval > 0 && hasData && !hasError && !isLoading) {
				const timeout = setTimeout(() => {
					this.refresh();
				}, interval * 1000);
				return () => clearTimeout(timeout);
			}
		});

		// Resource for fetching max date when detect_max_date is enabled
		this.maxDateResource = resource(
			[() => this.maxDateQuery],
			async ([maxDateQuery], [lastMaxDateQuery], { signal, data: lastData }) => {
				if (this._destroyed) return lastData;

				// Only execute if there's actually a max date query to run
				if (!maxDateQuery) return undefined;

				// Only refetch if query changed
				if (maxDateQuery === lastMaxDateQuery && lastData !== undefined) {
					return lastData;
				}

				const result = await this.deps.queryService.query<{ max_date: string }>(maxDateQuery, {
					signal,
					noCache: this.options.noCache
				});

				if (signal.aborted || this._destroyed) {
					return lastData;
				}

				// Return the ISO date string
				return result.rows[0]?.max_date;
			},
			{ debounce }
			// Not lazy - will execute immediately if maxDateQuery is defined
			// Early returns (line 58, 60-62) prevent unnecessary work
		);

		this.countResource = resource(
			[() => this.countQuery, () => this.rowLimitExceeded],
			async ([countQuery, rowLimitExceeded], [lastCountQuery], { signal, data: lastData }) => {
				if (this._destroyed) return lastData;

				if (!countQuery) return undefined;

				// Skip count query if limit not exceeded (we have all the data)
				if (!rowLimitExceeded) {
					// Return the actual row count from the data we fetched
					return this.dataResource.current?.result?.rows?.length;
				}

				// For non-pivot queries, wait for data resource to determine if we need count
				// Check if query has no pivotable columns (no dimensions/measures/pivots)
				const isNonPivotQuery = !this.hasPivotableColumns;

				// If it's a non-pivot query and data resource hasn't evaluated yet, wait
				// Check if dataResource.current exists (has been evaluated at least once)
				const dataResourceHasEvaluated = typeof this.dataResource.current !== 'undefined';
				if (isNonPivotQuery && !dataResourceHasEvaluated) {
					// Data resource hasn't run yet, wait for it to determine if we can client-side paginate
					return this.countResource.current;
				}

				// Only run count query if:
				// 1. Explicitly requested (count: true), OR
				// 2. Row limit exceeded in pagination mode (need count for "Page X of Y" UI)
				const needsCount = count || (rowLimitExceeded && exceedRowLimitBehavior === 'paginate');
				const hasRunCount = typeof this.countResource.current !== 'undefined';
				const countQueryChanged = countQuery !== lastCountQuery;
				const shouldRunCountNow = !hasRunCount || countQueryChanged;
				if (!needsCount || !shouldRunCountNow) return this.countResource.current;

				const result = await this.deps.queryService.query<{ total_count: number }>(countQuery, {
					signal,
					noCache: this.options.noCache
				});

				if (signal.aborted || this._destroyed) {
					return lastData;
				}

				return result.rows[0]?.total_count;
			},
			{ debounce, lazy: serialized?.count !== undefined }
		);

		if (serialized?.count) {
			this.countResource.mutate(serialized.count);
		}

		if (serialized?.maxDate) {
			this.maxDateResource.mutate(serialized.maxDate);
		}

		this.dataResource = rawResource(
			[
				() => this.dataQuery,
				() => this.pivotCheckQuery,
				() => this.nonPivotCheckQuery,
				() => this.paginationForcedQuery,
				() => this.samplingCheckQuery,
				() => this.maxDateResource.current, // Depend on max date
				() => (typeof this.query === 'object' ? this.query.limit : undefined), // Track limit changes
				() => this._refreshCounter // Track refresh requests
			],
			async (
				[
					dataQuery,
					pivotCheckQuery,
					nonPivotCheckQuery,
					paginationForcedQuery,
					samplingCheckQuery,
					maxDate,
					currentLimit,
					_refreshCounter
				],
				[
					_lastDataQuery,
					lastPivotCheckQuery,
					lastNonPivotCheckQuery,
					_lastPaginationForcedQuery,
					_lastSamplingCheckQuery,
					_lastMaxDate,
					lastLimit,
					lastRefreshCounter
				],
				{ signal, data: lastData }
			) => {
				if (this._destroyed) return lastData;

				// If we need a max date but don't have it yet, wait
				if (this.maxDateQuery && maxDate === undefined) {
					return lastData;
				}

				let rowLimitExceeded = this.dataResource.current?.rowLimitExceeded;
				let debugInfo: QueryDebugInfo = { checkType: 'none' };

				const hasCheckedRowLimit = typeof rowLimitExceeded !== 'undefined';
				const pivotCheckQueryChanged = pivotCheckQuery !== lastPivotCheckQuery;
				const nonPivotCheckQueryChanged = nonPivotCheckQuery !== lastNonPivotCheckQuery;
				const limitChanged = currentLimit !== lastLimit;
				// Only treat as refresh when the counter has actually been incremented (not on first run)
				const isRefresh =
					lastRefreshCounter !== undefined && _refreshCounter !== lastRefreshCounter;

				// For pagination mode: run check queries to determine if we need pagination
				if (exceedRowLimitBehavior === 'paginate') {
					// Check for tables with children (pivot check)
					// Re-run check if: never checked, query changed, limit changed, OR forced refresh
					if (
						pivotCheckQuery &&
						(!hasCheckedRowLimit || pivotCheckQueryChanged || limitChanged || isRefresh)
					) {
						const result =
							await this.deps.queryService.query<PivotResultSizeLowerBoundQueryResultRow>(
								pivotCheckQuery,
								{ signal, noCache: this.options.noCache || isRefresh }
							);
						if (signal.aborted || this._destroyed) {
							return lastData;
						}
						const checkResult = result.rows[0];
						const rawRowLimitExceeded = checkResult?.exceeds_lower_bound === 1;
						const columnLimitExceeded = checkResult?.exceeds_column_limit === 1;

						// ==========================================
						// STEP 1: Determine Pagination Strategy
						// ==========================================
						// This determines whether we can load all data (client-side)
						// or need page-by-page fetching (server-side)
						//
						// Server-side pagination PREVENTS pivoting and subtotals!

						const userLimit =
							this.query && typeof this.query !== 'string' ? this.query.limit : undefined;

						// User limit < PIVOT_ROW_LIMIT overrides the row check
						// The pivot check estimates from full underlying data, but user's limit caps the result
						if (userLimit && userLimit < PIVOT_ROW_LIMIT) {
							rowLimitExceeded = false;
						} else {
							rowLimitExceeded = rawRowLimitExceeded;
						}

						debugInfo = {
							checkType: 'pivot',
							pivotCheckExceedsLowerBound: rawRowLimitExceeded,
							pivotCheckExceedsColumnLimit: columnLimitExceeded,
							estimatedColumns: checkResult?.estimated_columns,
							userLimit,
							paginationDecision: rowLimitExceeded ? 'server' : 'client'
						};

						// If server-side pagination is needed, we CANNOT pivot or calculate subtotals
						// Stop here and let the normal query path handle pagination
						if (rowLimitExceeded) {
							// Server-side: will use paginationForcedQuery later
							// No pivoting, no subtotals possible
							debugInfo.finalDecision = 'server';
							// Continue to normal flow (don't return early)
						} else {
							// ==========================================
							// STEP 2: Determine Rendering Strategy
							// ==========================================
							// We have all data (client-side), now decide how to render it
							// This only runs if we're doing client-side pagination!

							if (columnLimitExceeded && this.query && typeof this.query !== 'string') {
								// Too many columns - treat pivots as dimensions to avoid browser crash
								debugInfo.renderingDecision = 'pivots_as_dimensions';

								const adjustedColumns = this.query.columns.map((col) =>
									col.type === 'pivot' ? { ...col, type: 'dimension' as const } : col
								);

								// Regenerate SQL for dimension-only mode
								// Regenerate groupingSets and subtotalHelperColumns with adjusted columns
								const adjustedQuery = {
									...this.query,
									columns: adjustedColumns,
									page_size: undefined, // Strip pagination for client-side rendering
									offset: undefined,
									groupingSets: this.query.subtotals
										? generateGroupingSets(adjustedColumns)
										: undefined,
									subtotalHelperColumns: this.query.subtotals
										? generateSubtotalHelperColumns(adjustedColumns, this.deps.queryService.dialect)
										: undefined
								};

								const { sql: adjustedSql, error } = generateSQLQuery(
									adjustedQuery,
									this.deps.filterContexts,
									this.deps.inlineQueries,
									this.anchorDate,
									this.projectSettings.first_day_of_week,
									this.deps.queryService.dialect
								);

								if (!error && adjustedSql) {
									const adjustedResult = await this.deps.queryService.query<RowType>(adjustedSql, {
										signal,
										noCache: this.options.noCache
									});
									if (signal.aborted || this._destroyed) {
										return lastData;
									}

									debugInfo.finalDecision = 'client';

									return {
										sql: adjustedSql,
										result: adjustedResult,
										rowLimitExceeded: false, // Client-side (we have all data)
										columnLimitExceeded: true,
										debug: debugInfo
									};
								}
							} else {
								// Normal pivoting - column count is reasonable
								debugInfo.renderingDecision = 'normal_pivot';
								debugInfo.finalDecision = 'client';
								// Continue to normal flow to fetch with pivot query
							}
						}
					}
					// If non-pivot check was skipped due to user limit, explicitly mark as not exceeded
					else if (!nonPivotCheckQuery && !this.hasPivotableColumns) {
						rowLimitExceeded = false;
					}
					// Check for non-pivot queries (fetch data directly with LIMIT 2001)
					else if (
						nonPivotCheckQuery &&
						(!hasCheckedRowLimit || nonPivotCheckQueryChanged || isRefresh)
					) {
						const result = await this.deps.queryService.query<RowType>(nonPivotCheckQuery, {
							signal,
							noCache: this.options.noCache || isRefresh
						});
						if (signal.aborted || this._destroyed) {
							return lastData;
						}

						// If we got < 2001 rows, we have all the data
						if (result.rows.length < NON_PIVOT_ROW_LIMIT + 1) {
							rowLimitExceeded = false;
							// Return the data immediately, no need for separate data query
							return {
								sql: nonPivotCheckQuery,
								result,
								rowLimitExceeded: false,
								columnLimitExceeded: false,
								debug: {
									checkType: 'non-pivot',
									rowsReturned: result.rows.length,
									finalDecision: 'client'
								}
							};
						} else {
							// Too many rows, need server-side pagination
							// But we can use the first page from these cached rows!
							rowLimitExceeded = true;

							// Get the page size from the query config
							const pageSize = typeof this.query === 'object' ? this.query.page_size || 10 : 10;

							// Slice the first page from the cached check query result
							const firstPageResult = {
								...result,
								rows: result.rows.slice(0, pageSize)
							};

							// Return first page immediately - no need for separate paginated query!
							return {
								sql: nonPivotCheckQuery,
								result: firstPageResult,
								rowLimitExceeded: true,
								columnLimitExceeded: false,
								debug: {
									checkType: 'non-pivot',
									rowsReturned: result.rows.length,
									finalDecision: 'server'
								}
							};
						}
					}
					// If limit not exceeded and not a forced refresh, return cached data (we have everything)
					else if (nonPivotCheckQuery && !rowLimitExceeded && !isRefresh) {
						return lastData;
					}
					// If row limit exceeded and we're on the first page (offset=0), return cached data (unless refreshing)
					else if (nonPivotCheckQuery && rowLimitExceeded && !isRefresh) {
						// Check if we're on page 1 (offset=0 or undefined)
						const currentOffset = typeof this.query === 'object' ? (this.query.offset ?? 0) : 0;
						const currentPageSize =
							typeof this.query === 'object' ? this.query.page_size || 10 : 10;

						// Use cached data ONLY if:
						// 1. We're on the first page (offset=0)
						// 2. The cached data is from the check query (not a previous pagination query)
						// 3. The cached data has the correct number of rows for current page_size
						//
						// We verify the cached data is from the check query by comparing SQL.
						// We verify the page_size by checking row count.
						//
						// This handles edge cases like:
						// - User navigates to page 2, then back to page 1 (sql would differ)
						// - User changes page_size while on page 1 (row count would differ)
						const lastSql = lastData?.sql;
						const cachedRowCount = lastData?.result?.rows?.length ?? 0;
						if (
							currentOffset === 0 &&
							lastData &&
							lastSql === nonPivotCheckQuery &&
							cachedRowCount === currentPageSize
						) {
							// We have the first page cached from the check query with correct page_size, return it
							return lastData;
						}
						// For subsequent pages (offset > 0) or if cache is stale, fall through to pagination logic below
					}
				}

				// If we preserved columnLimitExceeded from a previous run and checks were skipped,
				// reuse the entire previous result to avoid regenerating SQL with wrong config
				const preservedColumnLimitExceeded = lastData?.columnLimitExceeded;
				if (
					preservedColumnLimitExceeded &&
					!pivotCheckQueryChanged &&
					!limitChanged &&
					!isRefresh
				) {
					// Previous run had column limit exceeded, checks weren't re-run
					// Return previous result to avoid SQL regeneration with wrong config
					return lastData;
				}

				// Determine which SQL to execute
				let sql = dataQuery;
				if (rowLimitExceeded && exceedRowLimitBehavior === 'paginate') {
					sql = paginationForcedQuery;
				} else if (exceedRowLimitBehavior === 'sample') {
					// For sampling mode: enforce row limit with LIMIT clause
					sql = samplingCheckQuery;
				}

				if (!sql) return undefined;

				const lastSql = this.dataResource.current?.sql;
				// Skip cache check if noCache is enabled or if this is a forced refresh
				if (!this.options.noCache && !isRefresh && sql === lastSql) {
					return lastData;
				}

				const result = await this.deps.queryService.query<RowType>(sql, {
					signal,
					// Bypass cache on refresh to get fresh data
					noCache: this.options.noCache || isRefresh
				});

				if (signal.aborted || this._destroyed) {
					return lastData;
				}

				// For sampling mode: detect limit exceeded by checking row count
				if (exceedRowLimitBehavior === 'sample') {
					const userLimit = typeof this.query === 'object' ? this.query.limit : undefined;

					// If user specified a limit, don't treat it as sampling
					// User-specified limits are intentional, not system-enforced sampling
					if (userLimit && userLimit <= (this.options.maxUserLimit ?? MAX_USER_LIMIT)) {
						rowLimitExceeded = false;
					} else {
						// We applied sampling limit, check if it was hit
						rowLimitExceeded = result.rows.length >= NON_PIVOT_ROW_LIMIT;
					}
				}

				debugInfo.finalDecision = rowLimitExceeded ? 'server' : 'client';

				return {
					sql,
					result,
					rowLimitExceeded: rowLimitExceeded ?? false,
					columnLimitExceeded: false,
					debug: debugInfo
				};
			},
			{ debounce, lazy: serialized?.data !== undefined }
		);

		if (serialized?.data) {
			this.dataResource.mutate(serialized.data);
		}
	}

	private readonly dataResource: ResourceReturn<{
		sql: string;
		result: QueryResult<RowType>;
		rowLimitExceeded: boolean;
		columnLimitExceeded: boolean;
		debug?: QueryDebugInfo;
	}>;
	private readonly countResource: ResourceReturn<number | undefined>;
	private readonly maxDateResource: ResourceReturn<string | undefined>;

	private readonly projectSettings = $derived.by(() =>
		extract(this.deps.projectSettings, DEFAULT_PROJECT_SETTINGS)
	);

	get query() {
		try {
			return this.queryGetter();
		} catch {
			return undefined;
		}
	}

	get loadingCount() {
		return this.countResource?.loading;
	}

	get count() {
		return this.countResource?.current;
	}

	get sql() {
		return this.dataResource.current?.sql;
	}

	loading = $derived.by(() => {
		const dataHasExecuted =
			typeof this.dataResource.error !== 'undefined' ||
			typeof this.dataResource.current !== 'undefined';

		const resourceLoading = !dataHasExecuted || this.dataResource.loading;

		// During a background refresh, suppress loading so components keep showing stale data
		if (this._isRefreshing && dataHasExecuted) {
			return false;
		}

		// Combine manual loading trigger (for smooth transitions) with actual resource loading
		return this._manualLoading || resourceLoading;
	});

	/** True when a background refresh is in flight (data is stale but still displayed) */
	refreshing = $derived.by(() => this._isRefreshing && this.dataResource.loading);

	get result() {
		return this.dataResource.current?.result;
	}

	// Covers SQL errors returned in the result and thrown fetch failures (which leave result undefined).
	get error(): string | null {
		const thrown = this.dataResource.error;
		if (typeof thrown !== 'undefined') {
			return enrichWarehouseError(thrown instanceof Error ? thrown.message : String(thrown));
		}
		const resultError = this.result?.error;
		return resultError ? enrichWarehouseError(resultError) : null;
	}

	get rowLimitExceeded() {
		return this.dataResource.current?.rowLimitExceeded;
	}

	get samplingForced() {
		return this.rowLimitExceeded && this.options.exceedRowLimitBehavior === 'sample';
	}

	get paginationForced() {
		return this.rowLimitExceeded && this.options.exceedRowLimitBehavior === 'paginate';
	}

	get columnLimitExceeded() {
		return this.dataResource.current?.columnLimitExceeded ?? false;
	}

	get debugInfo() {
		return this.dataResource.current?.debug;
	}

	get queryCount() {
		let count = 0;

		// Check query (pivot or non-pivot)
		const debug = this.dataResource.current?.debug;
		if (debug?.checkType === 'pivot' || debug?.checkType === 'non-pivot') {
			count += 1; // Check query ran
		}

		// Data query (always runs)
		if (this.dataResource.current?.result) {
			count += 1;
		}

		// Count query (only runs as separate SQL for server-side pagination)
		// If rowLimitExceeded is false, countResource returns data row count (not a separate query)
		if (this.rowLimitExceeded && this.countResource.current !== undefined) {
			count += 1;
		}

		return count;
	}

	get maxDateQuery() {
		// Max date detection is not currently used - date calculations use computedDefaultDateRangeEnd from project settings
		return undefined;
	}

	/**
	 * Get anchor date for all query generation.
	 * Priority: detected max date > project default date range end > today
	 */
	private get anchorDate(): Date {
		// If we detected a max date, use it
		if (this.maxDateResource.current) {
			return parseDateStringAsLocalMidnight(this.maxDateResource.current);
		}

		// Use the project's configured default date range end
		if (this.projectSettings.computedDefaultDateRangeEnd) {
			return parseDateStringAsLocalMidnight(this.projectSettings.computedDefaultDateRangeEnd);
		}

		// Fallback to current date
		return new Date();
	}

	/**
	 * Check if query has dimensions, measures, or pivots (i.e., requires aggregation/pivoting)
	 */
	private get hasPivotableColumns(): boolean {
		if (!this.query || typeof this.query === 'string') return false;

		return this.query.columns.some(
			(col) => col.type === 'dimension' || col.type === 'measure' || col.type === 'pivot'
		);
	}

	/**
	 * Build WHERE clause for check queries (pivot check, non-pivot check)
	 * Combines user's where, date_range, and filter bar selections
	 */
	private buildWhereClauseForCheck(): string | undefined {
		if (!this.query || typeof this.query === 'string') return undefined;

		const whereParts: string[] = [];

		// Process filter IDs if provided
		if (this.query.filterIds && this.deps.filterContexts) {
			const filterSql = processFilterIds(this.query.filterIds, this.deps.filterContexts);
			if (filterSql) whereParts.push(filterSql);
		}

		// Add user's WHERE clause
		if (this.query.where) whereParts.push(this.query.where);

		// Generate date filter SQL if date_range is provided
		if (
			this.query.date_range &&
			this.query.date_range.range &&
			this.query.date_range.range !== 'all time'
		) {
			const processed = processDateRange(
				this.query.date_range.range,
				this.query.date_range.date,
				this.anchorDate,
				this.projectSettings.first_day_of_week,
				this.deps.queryService.dialect
			);
			if (processed.whereClause) whereParts.push(processed.whereClause);
		}

		if (whereParts.length === 0) return undefined;

		// Build WHERE clause by wrapping each part in parentheses and joining with AND
		return `WHERE ${whereParts.map((part) => `(${part})`).join(' AND ')}`;
	}

	// Memoized via $derived: runed's watch() (used by dataResource) re-fires its
	// effect on every reactive dep invalidation regardless of whether source
	// values actually changed. If this stays a plain getter, every parent re-render
	// or filter change invalidates and re-fires the data fetcher even when the
	// generated SQL string is identical — each new fire aborts the in-flight query,
	// so loading never settles (infinite spinner). $derived's `===` value-equality
	// short-circuits the cascade when the SQL string is unchanged.
	readonly dataQuery: string | undefined = $derived.by(() => {
		if (!this.query) return undefined;
		if (typeof this.query === 'string') return this.query;

		const { sql, error } = generateSQLQuery(
			{
				...this.query,
				page_size: undefined,
				offset: undefined
			},
			this.deps.filterContexts,
			this.deps.inlineQueries,
			this.anchorDate,
			this.projectSettings.first_day_of_week,
			this.deps.queryService.dialect
		);

		if (error) {
			logger.error({ generateSQLQueryError: error }, '[Query] Failed to generate dataQuery');
			if (browser) posthog.capture('Query-dataQuery-failed', { error, query: this.query });
			return;
		}

		return sql;
	});

	// When using pivots, we check the row limit using a more efficient method: `buildPivotResultSizeLowerBoundQuery`
	// Memoized via $derived for the same reason as `dataQuery` above.
	readonly pivotCheckQuery: string | undefined = $derived.by(() => {
		if (!this.query || typeof this.query === 'string') return undefined;

		// NOTE: We used to skip the check if limit < PIVOT_ROW_LIMIT, but we still need
		// to check column count even with small row limits (e.g. limit=1000 with 1000+ pivot values)

		// Extract dimensions and pivots from ProcessedColumns
		const dimensions = this.query.columns
			.filter((col) => col.type === 'dimension')
			.map((col) => col.sqlWithAlias);
		const pivots = this.query.columns
			.filter((col) => col.type === 'pivot')
			.map((col) => col.sqlWithAlias);

		if (!dimensions.length && !pivots.length) return undefined;

		// During editing, user may temporarily have invalid template syntax
		// (e.g. unbalanced brackets) which causes getInterpolated to throw.
		// Fall back to the raw table expression name to avoid crashing the page —
		// downstream SQL execution will surface the malformed query as a query error.
		// Per core/src/user-components/COMPONENT_SYSTEM.md rule 4.
		let tableExpression: string;
		try {
			tableExpression = resolveTableExpressionName(
				this.query.tableExpressionName,
				this.deps.inlineQueries,
				this.deps.queryService.dialect,
				this.query.tableExpressionIsSql === true
			);
		} catch (error) {
			logger.warn(
				{ error, tableExpressionName: this.query.tableExpressionName },
				'[Query] Failed to interpolate inline query for pivotCheckQuery, using raw table expression'
			);
			tableExpression = quoteUntrustedIdentifierPath(
				this.query.tableExpressionName,
				this.deps.queryService.dialect
			);
		}

		// Build WHERE clause to respect user's filters
		const whereClause = this.buildWhereClauseForCheck();

		// Count measures for column estimation
		const measuresCount = this.query.columns.filter((col) => col.type === 'measure').length;

		// Pass user's limit to get more accurate distinct counts when they specify a small limit
		const userLimit = this.query.limit;

		const checkSql = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			tableExpression,
			PIVOT_ROW_LIMIT,
			whereClause,
			PIVOT_COLUMN_LIMIT,
			measuresCount,
			userLimit
		);

		return checkSql;
	});

	// For non-pivot queries, fetch data with LIMIT 2001 to check if client-side pagination is possible
	// Memoized via $derived for the same reason as `dataQuery` above.
	readonly nonPivotCheckQuery: string | undefined = $derived.by(() => {
		if (!this.query || typeof this.query === 'string') return undefined;

		// Only use this check for queries without dimensions/measures/pivots
		if (this.hasPivotableColumns) return undefined;

		if (this.query.limit && this.query.limit <= NON_PIVOT_ROW_LIMIT) {
			return undefined;
		}

		const { sql, error } = generateSQLQuery(
			{
				...this.query,
				offset: undefined,
				page_size: undefined,
				limit: NON_PIVOT_ROW_LIMIT + 1
			},
			this.deps.filterContexts,
			this.deps.inlineQueries,
			this.anchorDate,
			this.projectSettings.first_day_of_week,
			this.deps.queryService.dialect
		);

		if (error) {
			logger.error(
				{ generateSQLQueryError: error },
				'[Query] Failed to generate nonPivotCheckQuery'
			);
			if (browser) posthog.capture('Query-nonPivotCheckQuery-failed', { error, query: this.query });
			return undefined;
		}

		return sql;
	});

	// Memoized via $derived for the same reason as `dataQuery` above.
	readonly paginationForcedQuery: string | undefined = $derived.by(() => {
		if (!this.query || typeof this.query === 'string') return undefined;

		const { sql } = generateSQLQuery(
			{
				...this.query,
				page_size: this.query.page_size ?? 10,
				offset: this.query.offset ?? 0,
				subtotals: false
			},
			this.deps.filterContexts,
			this.deps.inlineQueries,
			this.anchorDate,
			this.projectSettings.first_day_of_week,
			this.deps.queryService.dialect
		);
		return sql;
	});

	// Memoized via $derived for the same reason as `dataQuery` above.
	readonly samplingCheckQuery: string | undefined = $derived.by(() => {
		if (!this.query || typeof this.query === 'string') return this.dataQuery;

		const userLimit = this.query.limit;

		if (userLimit && userLimit <= (this.options.maxUserLimit ?? MAX_USER_LIMIT)) {
			return this.dataQuery;
		}

		const { sql } = generateSQLQuery(
			{
				...this.query,
				limit: NON_PIVOT_ROW_LIMIT
			},
			this.deps.filterContexts,
			this.deps.inlineQueries,
			this.anchorDate,
			this.projectSettings.first_day_of_week,
			this.deps.queryService.dialect
		);

		return sql;
	});

	get countQuery() {
		if (!this.query) return undefined;
		if (typeof this.query === 'string') return undefined;

		const { sql: unpaginatedSql, error } = generateSQLQuery(
			{
				...this.query,
				offset: undefined,
				page_size: undefined
			},
			this.deps.filterContexts,
			this.deps.inlineQueries,
			this.anchorDate,
			this.projectSettings.first_day_of_week,
			this.deps.queryService.dialect
		);

		if (error) {
			logger.error({ generateSQLQueryError: error }, '[Query] Failed to generate countQuery');
			if (browser) posthog.capture('Query-countQuery-failed', { error, query: this.query });
			return;
		}

		return `SELECT COUNT(*) AS "total_count" FROM (${unpaginatedSql})`;
	}

	async init(): Promise<void> {
		if (browser) {
			throw new Error('Query.init is meant to be called only on the server');
		}
		await Promise.all([await this.countResource.refetch(), await this.dataResource.refetch()]);
	}

	/**
	 * Force a refresh of the query, bypassing cache.
	 * This is a background refresh — existing data stays visible while new data loads.
	 */
	refresh(): void {
		// Mark as background refresh so loading state is suppressed
		this._isRefreshing = true;
		// Increment the refresh counter to trigger a reactive update
		// The dataResource depends on this counter and will refetch with noCache=true
		this._refreshCounter++;
	}

	toSerialized(): SerializedQuery<RowType> {
		return {
			data: this.dataResource.current,
			count: this.countResource.current,
			maxDate: this.maxDateResource.current
		};
	}
}
