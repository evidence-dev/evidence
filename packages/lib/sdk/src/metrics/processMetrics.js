/**
 *
 * @param {import("./types.js").MetricDef} metric
 * @returns { { query: string, filterSpec: {}, name: string } }
 */
export const processMetric = (metric) => {
	/**
	 * @param {string} keyPath
	 * @param {string} valuePath
	 * @returns
	 */
	const hasValue = (keyPath, valuePath) =>
		`(!inputs[MetricsInputKey].${metric.name}?.${keyPath}[Unset] && inputs[MetricsInputKey].${metric.name}?.${keyPath}${valuePath})`;
	const queryString = `
        SELECT 
            ${metric.aggregation}(${metric.expression}) as ${metric.name},
            \${
                ${hasValue('dimensions', '?.rawValues?.length')}
                    ? inputs[MetricsInputKey].${metric.name}.dimensions?.rawValues?.map(d => \`"\${d.value}"\`)?.join(', ') + ','
                    : ''
            } -- dimensions
            \${
                ${hasValue('time_grain', '.value')}
                    ? \`date_trunc(
                        '\${inputs[MetricsInputKey].${metric.name}.time_grain.value}',
                        "${metric.time_expression}"
                    ) as grain,\` 
                    : ''
            } -- grains

        FROM 
            ${'query' in metric.source ? `(${metric.source.query}) as ${metric.name}_source` : `"${metric.source.datasource}"."${metric.source.table}"`}
            
        GROUP BY ALL
    `;
    console.log(queryString)

	return {
		query: queryString,
		filterSpec: '',
		name: metric.name
	};
};
