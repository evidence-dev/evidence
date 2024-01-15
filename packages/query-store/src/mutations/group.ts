import { count, Query } from '@uwdata/mosaic-sql';

export const group = (q: Query, columns: string[] | string): Query => {
	return q.$select(columns, { rows: count('*') }).$groupby(columns);
};
