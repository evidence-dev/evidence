import { Query as QueryBuilder, sql } from '@uwdata/mosaic-sql';
/**
 *
 * @param {import("./types.js").MetricSpec} metric
 * @param {any} cut
 */
export const metricDefToSql = (metric, cut) => {
	const outQuery = new QueryBuilder();
	if ('query' in metric.source) {
		outQuery.from({ metricSource: metric.source.query });
	} else {
		outQuery.from(sql`"${metric.source.datasource}"."${metric.source.table}"`);
	}
	// Select the metric
	outQuery.$select({
		[metric.name]: sql`${metric.aggregation}(${metric.expression})`
	});

	for (const dimension of cut?.dimensions ?? []) {
		outQuery.select({ [dimension]: dimension });
	}

	if (cut.time_grain) {
		outQuery.select({
			grain: sql`date_trunc('${cut.time_grain}', "${metric.time_expression}")`
		});
	}

	outQuery.$groupby(sql`ALL`);

	return outQuery.toString();
};
