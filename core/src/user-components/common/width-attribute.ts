import type { UserComponentSchema } from '../types';

export const WIDTH_ATTRIBUTE = {
	width: {
		type: Number,
		required: false,
		description: 'Set the width of this component (in percent) relative to the page width'
	}
} as const satisfies UserComponentSchema['attributes'];
