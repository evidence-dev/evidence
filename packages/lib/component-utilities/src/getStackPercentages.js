import { tidy, groupBy, sum, mutateWithSummary, mutate, rate, rename } from '@tidyjs/tidy';

export default function getStackPercentages(data, groupCol, valueCol) {
	let pctData;
	if (typeof valueCol !== 'object') {
		pctData = tidy(
			data,
			groupBy(groupCol, mutateWithSummary({ xTotal: sum(valueCol) })),
			mutate({ percentOfX: rate(valueCol, 'xTotal') }),
			rename({
				percentOfX: valueCol + '_pct'
			})
		);
	} else {
		pctData = tidy(
			data,
			mutate({
				valueSum: 0
			})
		);

		for (let i = 0; i < pctData.length; i++) {
			pctData[i].valueSum = 0;
			for (let j = 0; j < valueCol.length; j++) {
				pctData[i].valueSum = pctData[i].valueSum + pctData[i][valueCol[j]];
			}
		}

		pctData = tidy(pctData, groupBy(groupCol, mutateWithSummary({ xTotal: sum('valueSum') })));

		for (let i = 0; i < valueCol.length; i++) {
			pctData = tidy(
				pctData,
				mutate({ percentOfX: rate(valueCol[i], 'xTotal') }),
				rename({
					percentOfX: valueCol[i] + '_pct'
				})
			);
		}
	}

	return pctData;
}
