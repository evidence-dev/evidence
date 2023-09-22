import { forceArray } from '../utils/forceArray.js';
import { type Query, avg, sum } from '@uwdata/mosaic-sql';


type MaybeAliased = string | {col: string, alias: string}

type AggArgs = {
	sum: MaybeAliased[] | MaybeAliased,
	avg: MaybeAliased[] | MaybeAliased
}

export const agg = (q: Query, aggConfig: AggArgs): Query => {
	if ('sum' in aggConfig) {
		for (const column of forceArray(aggConfig.sum)) {
			const alias = typeof column === 'object' && "alias" in column ? column.alias : `sum_${column}`;
			q.select({ [alias]: sum(column) });
		}
	}
	if ('avg' in aggConfig) {
		for (const column of forceArray(aggConfig.avg)) {
			const alias = typeof column === 'object' && "alias" in column ? column.alias : `avg_${column}`;
			q.select({ [alias]: avg(column) });
		}
	}

	console.log(q.toString())

	return q;
};
