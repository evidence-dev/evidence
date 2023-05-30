import { tidy, replaceNully } from '@tidyjs/tidy';

export default function replaceNulls(data, columns) {
	let colObj = {};
	if (typeof columns === 'object') {
		for (let i = 0; i < columns.length; i++) {
			colObj[columns[i]] = 0;
		}
	} else {
		colObj[columns] = 0;
	}
	data = tidy(data, replaceNully(colObj));
	return data;
}
