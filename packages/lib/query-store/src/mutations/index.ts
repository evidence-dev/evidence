import { agg } from './agg.js';
import { group } from './group.js';
import { order } from './order.js';
import { limit, offset } from './pagination.js';
import { where } from './where.js';

export const mutations = {
	agg: {
		fn: agg,
		currentAsInitial: false
	},
	groupBy: {
		fn: group,
		currentAsInitial: false
	},
	orderBy: {
		fn: order,
		currentAsInitial: true
	},
	where: {
		fn: where,
		currentAsInitial: true
	},
	limit: {
		fn: limit,
		currentAsInitial: true
	},
	offset: {
		fn: offset,
		currentAsInitial: true
	}
} as const;
