import { tidy, summarize, nDistinct } from '@tidyjs/tidy';

export default function getDistinctCount(data, column) {
	let distinctCount = tidy(data, summarize({ count: nDistinct(column) }))[0].count;

	return distinctCount;
}
