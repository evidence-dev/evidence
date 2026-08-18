import type { UserComponentSchema } from '../../../types';

export const schema = {
	selfClosing: true,
	attributes: {
		y: {
			type: [String, Array],
			required: true,
			description: 'Column name for y-axis',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		y2: {
			type: [String, Array],
			required: false,
			description: 'Column name for secondary y-axis',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		series: {
			type: String,
			required: false,
			description: 'Column name for series grouping (applies to all series)',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		}
	}
	// TODO implement y validation here and reuse in bar_chart, area_chart, etc
} as const satisfies Partial<UserComponentSchema>;
