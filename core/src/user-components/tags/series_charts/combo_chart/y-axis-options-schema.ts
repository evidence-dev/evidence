import { z } from 'zod';
import { setZodMetadata } from '../../../common/zod-metadata';
import {
	booleanVariableSchema,
	numberVariableSchema,
	axisValueVariableSchema
} from '../../../common/zod-attribute';

export const yAxisOptionsSchema = z
	.object({
		title: setZodMetadata(z.string().optional(), { supportsVariables: true }),
		title_position: z
			.enum(['top', 'side'], {
				description:
					'Position of the axis title. "top" places it horizontally at the top, "side" places it vertically along the axis. Defaults to "side" for 100% stacked charts, "top" otherwise.'
			})
			.optional(),
		ticks: setZodMetadata(booleanVariableSchema.optional().default(false), {
			supportsVariables: true
		}),
		baseline: setZodMetadata(booleanVariableSchema.optional(), {
			supportsVariables: true
		}),
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
		fit_to_data: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(false)
				.describe('Fit the axis to the data instead of including 0'),
			{ supportsVariables: true }
		),
		interval: setZodMetadata(
			numberVariableSchema
				.optional()
				.describe(
					'Interval between axis ticks for numeric axes. This option is a suggestion, the actual interval may differ.'
				),
			{ supportsVariables: true }
		)
	})
	.default({});
