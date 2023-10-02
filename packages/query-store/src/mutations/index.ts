import { agg } from './agg.js';
import { group } from './group.js';
import { order } from './order.js';
import { limit, offset } from './pagination.js';
import { where } from './where.js';

export const mutations = {
	agg: agg,
	groupBy: group,
	orderBy: order,
	where: where,
	limit: limit,
	offset: offset
} as const;
