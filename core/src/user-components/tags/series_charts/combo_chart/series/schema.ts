import { ZodAttribute } from '../../../../common/zod-attribute';
import { FMT_OPTIONS } from '../../../../formatValue';
import type { UserComponentAttribute, UserComponentSchema } from '../../../../types';
import {
	and,
	validateSqlExpression,
	axisHasAggregation,
	validateFormatCode,
	validateEmptyAttributes,
	metricExists
} from '../../../../validators';
import { ifCondition } from '../../../../validators/ifCondition';
import { z } from 'zod';
import { setZodMetadata } from '../../../../common/zod-metadata';
import {
	TOOLTIP_FIELDS_ATTRIBUTE,
	validateTooltipFieldFormats
} from '../../../../common/tooltip-fields';
import { METRIC_ATTRIBUTE } from '../../../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../../../common/data-sources';

/** True when this child series is NOT in metric mode (uses the raw `y` SQL path). */
const notMetric = (node: { attributes?: Record<string, unknown> }): boolean =>
	!node.attributes?.metric;

/**
 * A series child is driven EITHER by a `metric` (the metric's aggregate SQL
 * becomes `y`, and its base becomes the query's data table) OR by the raw `y`
 * SQL against the parent combo_chart's `data`. XOR + `dataSources` so autocomplete/
 * docs/AI see the arrangements declaratively.
 */
const seriesDataSources = [
	{ requires: ['y'], forbids: ['metric'] },
	{ requires: ['metric'], forbids: ['y'] }
] as const satisfies readonly DataSource[];

/**
 * Shared `echarts_options` attribute used by every series child component
 * (line, bar, area, scatter, bubble). Raw ECharts series options deep-merged
 * into THIS series only — for chart-wide overrides on every series use the
 * parent chart's `echarts_series_options` instead.
 */
export const seriesEchartsOptionsAttribute = {
	type: ZodAttribute.create(
		setZodMetadata(z.record(z.unknown()).optional(), {
			blockExample: `\`\`\`
echarts_options={
    endLabel={ show=true }
    markPoint={ data=[{ type="max" } { type="min" }] }
}
\`\`\``
		})
	),
	required: false,
	description:
		'Raw [ECharts series options](https://echarts.apache.org/en/option.html#series) deep-merged into this series only. For overrides that apply to every series on the chart, set `echarts_series_options` on the parent chart instead.',
	affectsQuery: false
} as const satisfies UserComponentAttribute;

export const schema = {
	render: 'series',
	category: 'chart_slot',
	attributes: {
		type: {
			type: String,
			required: true,
			matches: ['bar', 'line', 'scatter']
		},
		y: {
			type: String,
			required: false,
			suggested: true,
			description:
				"Column name for y-axis. Aggregated at the parent combo_chart's `x=`. Omit when using `metric`.",
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		...METRIC_ATTRIBUTE,
		series: {
			type: String,
			required: false,
			description: 'Column name for series grouping',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		axis: {
			type: String,
			description: 'The axis to render the series on',
			required: false,
			matches: ['y1', 'y2'],
			default: 'y1'
		},
		fmt: {
			type: String,
			description: "Format for this series' values",
			required: false,
			suggestionType: 'format',
			supportsVariables: true,
			variableContext: 'text'
		},
		...TOOLTIP_FIELDS_ATTRIBUTE,
		data_labels: {
			description: 'Label each point in the series with its value',
			type: ZodAttribute.create(
				z.object({
					position: z
						.enum(['above', 'below', 'left', 'right', 'middle'], {
							description: 'Position the label relative to its data point'
						})
						.transform((value) => {
							// Convert our values to ECharts values
							if (value === 'above') return 'top';
							if (value === 'below') return 'bottom';
							if (value === 'middle') return 'inside';
							return value;
						}),
					fmt: setZodMetadata(
						z
							.union([
								z.enum(FMT_OPTIONS, {
									description: 'Format the label value. Defaults to series or axis fmt.'
								}),
								z.string()
							])
							.optional(),
						{ supportsVariables: true }
					),
					size: z.number({ description: 'Font size in px' }).optional().default(11),
					distance: z
						.number({ description: 'How far the label is from the data point' })
						.optional()
						.default(5),
					rotate: z.number({ description: 'Rotate each label (degrees)' }).optional().default(0),
					color: z.string({ description: 'Change the text color of the labels' }).optional(),
					border_color: z
						.string({
							description:
								'Change the border color surrounding text labels, defaults to chart background'
						})
						.optional(),
					show_overlap: z
						.boolean({ description: 'Show labels for every point even when they overlap' })
						.optional()
						.default(false)
				})
			),
			required: false,
			default: {}
		}
	},
	componentWrapper: false,
	selfClosing: true,
	dataSources: seriesDataSources,
	validate: and(
		validateDataSources(seriesDataSources),
		metricExists('metric'),
		// Raw-path SQL checks only apply when not driven by `metric`; the metric
		// supplies its own aggregate (validated by `metricExists`).
		ifCondition(
			notMetric,
			validateSqlExpression('y', 'data', 'select', { getTableNameFromParent: true })
		),
		ifCondition(
			notMetric,
			validateSqlExpression('y2', 'data', 'select', { getTableNameFromParent: true })
		),
		validateSqlExpression('series', 'data', 'select', { getTableNameFromParent: true }),
		validateSqlExpression('tooltip_fields', 'data', 'select', { getTableNameFromParent: true }),
		ifCondition(notMetric, axisHasAggregation('x', 'y', { getXFromParent: true })),
		validateFormatCode('fmt'),
		validateTooltipFieldFormats,
		validateEmptyAttributes()
	)
} as const satisfies UserComponentSchema;
