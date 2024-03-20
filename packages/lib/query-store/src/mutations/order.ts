import { desc, Query } from '@uwdata/mosaic-sql';

export const order = (q: Query, orderConfig: Record<string, boolean>): Query => {
	for (const [key, value] of Object.entries(orderConfig)) {
		if (value) {
			// Asc
			q.orderby(key);
		} else {
			// Desc
			q.orderby(desc(key));
		}
	}
	return q;
};
