import type { UserComponentAttribute } from '../types';
import { ZodAttribute } from './zod-attribute';
import { z } from 'zod';

/**
 * Schema for the handle_missing attribute.
 *
 * Controls how missing data points are handled in charts:
 * - 'connect': Auto-connect points (default ECharts behavior)
 * - 'gaps': Insert nulls to show visual breaks in the line
 * - 'zero': Insert zeros at missing intervals
 */
export const handleMissingSchema = z
	.enum(['connect', 'gaps', 'zero'])
	.optional()
	.default('connect')
	.describe('How to handle missing data points in the chart');

export type HandleMissing = z.infer<typeof handleMissingSchema>;

/**
 * Reusable handle_missing attribute definition for chart components.
 * Controls how missing data points are displayed in line and area charts.
 */
export const HANDLE_MISSING_ATTRIBUTE = {
	handle_missing: {
		type: ZodAttribute.create(handleMissingSchema),
		required: false,
		default: 'connect',
		description:
			'How to handle missing data points. "connect" auto-connects points (default), "gaps" shows visual breaks, "zero" fills with zeros.',
		affectsQuery: false,
		keywords: [
			'missing data',
			'gaps',
			'null values',
			'connect nulls',
			'fill gaps',
			'break line',
			'discontinuous'
		]
	}
} as const satisfies Record<string, UserComponentAttribute>;
