import type { UserComponentSchema } from '../types';

export const HEIGHT_ATTRIBUTE = {
	height: {
		type: Number,
		required: false,
		description: 'Set a fixed height for the chart in pixels'
	}
} as const satisfies UserComponentSchema['attributes'];
