import type { UserComponentSchema } from '../types';

export const CONNECT_GROUP_ATTRIBUTE = {
	connect_group: {
		type: String,
		required: false,
		description:
			'Link this chart to others sharing the same id, syncing their tooltips, axis-pointer, and zoom'
	}
} as const satisfies UserComponentSchema['attributes'];
