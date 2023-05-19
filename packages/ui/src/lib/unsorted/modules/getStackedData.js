import { tidy, groupBy, summarizeAt, sum } from '@tidyjs/tidy';

export default function getStackedData(data, groupCol, valueCol) {
	let stackedData = tidy(data, groupBy(groupCol, [summarizeAt(valueCol, sum)]));

	// If multiple y columns, iterate through data and add stack total column for sorting:
	if (typeof valueCol === 'object') {
		for (let i = 0; i < stackedData.length; i++) {
			stackedData[i].stackTotal = 0;
			for (let j = 0; j < valueCol.length; j++) {
				stackedData[i].stackTotal = stackedData[i].stackTotal + stackedData[i][valueCol[j]];
			}
		}
	}

	return stackedData;
}
