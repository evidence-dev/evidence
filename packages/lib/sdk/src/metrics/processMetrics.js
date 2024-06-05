/**
 *
 * @param {import("./types.js").MetricDef} metric
 * @returns { { query: string, filterSpec: {}, name: string } }
 */
export const processMetric = (metric) => {
	/**
	 *
	 * @param {string} keyPath
	 * @param {string} valuePath
	 * @returns
	 */
	const hasValue = (keyPath, valuePath) =>
		`(!inputs[MetricsInputKey].${metric.name}?.${keyPath}[Unset] && inputs[MetricsInputKey].${metric.name}?.${keyPath}${valuePath})`;
	const queryString = `
        SELECT 
            \${
                ${hasValue('dimensions', '?.rawValues?.length')}
                    ? inputs[MetricsInputKey].${metric.name}.dimensions?.rawValues?.map(d => \`"\${d.value}"\`)?.join(', ') + ','
                    : ''
            } -- dimensions
            \${
                ${hasValue('aggs', '?.rawValues?.length')}
                    ? inputs[MetricsInputKey].${metric.name}.aggs?.rawValues?.map(d => \`\${d.value}\`)?.join(', ') + ',' 
                    : ''
            } -- aggs
            \${
                ${hasValue('time_grain', '.value')}
                    ? \`date_trunc(
                        '\${inputs[MetricsInputKey].${metric.name}.time_grain.value}',
                        "${metric.time_expression}"
                    ) as grain,\` 
                    : ''
            } -- grains
            \${
                ${hasValue('aggs', '?.rawValues?.length')}
                    ? ''
                    : '${metric.expression} as "${metric.name}" -- Select this last to avoid trailing comma shenanigans' 
            }
            
        FROM ${metric.source.datasource}.${metric.source.table}
        GROUP BY ALL
    `;

	return {
		query: queryString,
		filterSpec: '',
		name: metric.name
	};
};
