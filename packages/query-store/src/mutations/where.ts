import { sql, Query } from '@uwdata/mosaic-sql';

export const where = (q: Query, fragment: string): Query => {
	q.where(sql`${fragment}`);

	return q;
};
