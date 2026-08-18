/**
 * Append a teaching hint to warehouse error messages whose literal text sends
 * the author down the wrong path. Pure string → string; applied at the single
 * choke point every component reads (`Query.error`), so the hint shows up in
 * the component error overlay, debug_code, and the AI chat alike.
 */

/**
 * ClickHouse 184 ILLEGAL_AGGREGATION: "Aggregate function ... is found in
 * WHERE in query". The message blames the WHERE clause, but the usual cause
 * is invisible in the SQL the author wrote: ClickHouse expands SELECT
 * *aliases* into WHERE, so `select sum(population) as population ... where
 * population is not null` silently filters on the aggregate. (Verified on
 * embedded ClickHouse: the same query with a non-colliding alias passes.)
 */
const AGGREGATE_IN_WHERE = /aggregate function .* is found in (WHERE|PREWHERE)/i;

export function enrichWarehouseError(message: string): string {
	if (AGGREGATE_IN_WHERE.test(message)) {
		return (
			message +
			'\n\nHint: ClickHouse substitutes SELECT aliases into WHERE. This usually means an aggregate’s alias has the same name as a column used in a filter (e.g. `sum(population) as population … where population is not null`), or a filter references the aggregate’s alias directly. Rename the alias so it doesn’t collide with any filtered column, or move the filters into an inner subquery and aggregate in the outer query.'
		);
	}
	return message;
}
