import { Query as QueryBuilder, sql } from '@uwdata/mosaic-sql';

/**
 * @param {import("./types.js").MetricSpec} metric
 * @param {import('./types.js').MetricCut} cut
 * @returns {QueryBuilder}
 */
export const applyCut = (metric, cut) => {
	const outQuery = new QueryBuilder();
	if ('query' in metric.source) {
		outQuery.from({ metricSource: metric.source.query });
	} else {
		outQuery.from(sql`"${metric.source.datasource}"."${metric.source.table}"`);
	}

	let expression = metric.expression;
	if (metric.expression.includes('metric(')) {
		// TODO: Expand
		const expandables = metric.expression.matchAll(/\bmetric\(((.*?))\)/g);
		console.warn('Metric references are not available yet!', {
			foundReferences: Array.from(expandables).map((v) => v[0])
		})
		expression = `(SELECT NULL WHERE 0) /* Metric references are not available yet */`
	}
	outQuery.$select({
		[metric.name]: sql`${metric.aggregation}(${expression})`
	});
	// Select the metric

	for (const dimension of cut?.dimensions ?? []) {
		if (!metric.dimensions.includes(dimension)) {
			console.error(`Unknown dimension: ${dimension}`, { cut });
			continue;
		}
		outQuery.select({ [dimension]: dimension });
	}

	if (cut.grain) {
		outQuery.select({
			grain: sql`date_trunc('${cut.grain}', "${metric.time_expression}")`
		});
	}

	outQuery.$groupby(sql`ALL`);
	return outQuery;
}



/**
 * @param {import("./types.js").MetricSpec} metric
 * @param {import('./types.js').MetricCut} cut
 */
export const metricDefToSql = (metric, cut) => {
	return applyCut(metric, cut).toString();
};
