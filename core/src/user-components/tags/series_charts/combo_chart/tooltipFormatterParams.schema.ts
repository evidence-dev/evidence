import { z } from 'zod';

/**
 * This schema is used to quickly validate the shape of the argument to the ECharts tooltip.formatter callback
 * The type (TopLevelFormatterParams) has many unions in it, and the specific types are known because of how
 * we're specifying our ECharts options (e.g. series is always an array), so this schema validates those
 * "assumptions" quickly and easily (as opposed to a bunch of if statements)
 */
const tooltipFormatterParamsSchema = z.object({
	value: z.array(z.any()),
	axisIndex: z.number().optional(),
	seriesIndex: z.number(),
	// 100%-stacked tooltips resolve the hovered-column raw value from this;
	// without it declared, zod's default key-stripping drops it before the formatter.
	dataIndex: z.number(),
	seriesName: z.string(),
	marker: z.string(),
	seriesType: z.string(),
	// When a series uses `tooltip_fields`, its data items are emitted as
	// `{ value, extras }` objects instead of bare tuples; echarts passes the
	// whole item back on `data`. Declared here so zod passes it through.
	data: z.unknown().optional()
});

export function shouldDisplayTooltipParam(
	param: z.infer<typeof tooltipFormatterParamsSchema>
): boolean {
	const isMissing =
		param.data !== null &&
		typeof param.data === 'object' &&
		!Array.isArray(param.data) &&
		'isMissing' in param.data &&
		param.data.isMissing === true;
	return param.value[1] !== null && param.value[1] !== undefined && !isMissing;
}

export const tooltipFormatterArgSchema = z
	.union([tooltipFormatterParamsSchema, z.array(tooltipFormatterParamsSchema)])
	.transform((value) => {
		if (Array.isArray(value)) return value;
		return [value];
	});
