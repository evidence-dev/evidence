import { z } from 'zod';
import { setZodMetadata } from '../../../common/zod-metadata';
import {
	booleanVariableSchema,
	numberVariableSchema,
	axisValueVariableSchema
} from '../../../common/zod-attribute';

export const xAxisOptionsSchema = z
	.object({
		title: setZodMetadata(z.string().optional(), { supportsVariables: true }),
		show_title: setZodMetadata(
			booleanVariableSchema
				.optional()
				.describe(
					'When `true`, renders the auto-derived axis title (the x column name) below the chart. Ignored when `title` is set explicitly. Defaults to `false` — auto-derived column-name titles usually read as visual noise and the axis labels speak for themselves.'
				),
			{ supportsVariables: true }
		),
		label_wrap: setZodMetadata(booleanVariableSchema.optional(), { supportsVariables: true }),
		ticks: setZodMetadata(booleanVariableSchema.optional().default(false), {
			supportsVariables: true
		}),
		baseline: setZodMetadata(booleanVariableSchema.optional(), { supportsVariables: true }),
		labels: setZodMetadata(
			booleanVariableSchema.optional().default(true).describe('Show/hide axis labels'),
			{ supportsVariables: true }
		),
		gridlines: setZodMetadata(booleanVariableSchema.optional().describe('Show/hide gridlines'), {
			supportsVariables: true
		}),
		min: setZodMetadata(
			axisValueVariableSchema
				.optional()
				.describe(
					'Minimum value for this axis (number for numeric axes, date string for date axes)'
				),
			{
				supportsVariables: true
			}
		),
		max: setZodMetadata(
			axisValueVariableSchema
				.optional()
				.describe(
					'Maximum value for this axis (number for numeric axes, date string for date axes)'
				),
			{
				supportsVariables: true
			}
		),
		// No schema-level default: the effective default is contextual (value
		// x-axes fit to data, time/category don't) and decided in XAxisModel.
		// A .default(false) here would mask "user didn't say" as an explicit
		// false before the model ever sees it.
		fit_to_data: setZodMetadata(
			booleanVariableSchema
				.optional()
				.describe(
					'Fit the axis to the data instead of including 0. Defaults to true for numeric x-axes, false otherwise.'
				),
			{ supportsVariables: true }
		),
		min_interval: z
			.enum(['year', 'quarter', 'month', 'week', 'day', 'hour'], {
				description:
					'Minimum interval between axis ticks for time-based axes. This option is a suggestion, the actual interval may differ.'
			})
			.optional(),
		max_interval: z
			.enum(['year', 'quarter', 'month', 'week', 'day', 'hour'], {
				description:
					'Maximum interval between axis ticks for time-based axes. This option is a suggestion, the actual interval may differ.'
			})
			.optional(),
		interval: setZodMetadata(
			numberVariableSchema
				.optional()
				.describe(
					'Interval between axis ticks for numeric axes. This option is a suggestion, the actual interval may differ.'
				),
			{ supportsVariables: true }
		),
		label_rotate: setZodMetadata(
			numberVariableSchema
				.optional()
				.describe(
					'Rotation angle of axis label in degrees. Positive values rotate clockwise, negative values rotate counter-clockwise.'
				),
			{ supportsVariables: true }
		),
		title_arrow: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(true)
				.describe('Show/hide the arrow (→) on the axis title'),
			{ supportsVariables: true }
		),
		max_label_length: setZodMetadata(
			numberVariableSchema
				.optional()
				.describe(
					'Maximum character length for axis labels. Labels exceeding this length will be truncated with an ellipsis. Defaults to 20 characters when labels are rotated.'
				),
			{ supportsVariables: true }
		)
	})
	.default({});
