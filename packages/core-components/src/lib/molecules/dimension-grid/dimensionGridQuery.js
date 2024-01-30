// SQL query to get a long dimensional table
// dimension | dimensionName | metric | filteredMetric - (metric filtered by the whereClause)
// optionally includes an "Others" row and a "Grand Total" row, each which respect the whereClause

// Where clause that optionally excludes any reference to the excluded dimension
const getWhereClause = function (selectedDimensions, excludeDimension) {
	let whereClause = 'true';
	if (excludeDimension) {
		selectedDimensions = selectedDimensions?.filter((d) => d.dimension !== excludeDimension);
	}
	if (selectedDimensions?.length > 0) {
		whereClause = selectedDimensions
			.map((d) => {
				return `${d.dimension} = '${d.value.replaceAll("'", "''")}'`;
			})
			.join(' and ');
	}
	return whereClause;
};

const topNQuery = function (data, dimension, metric, limit, selectedDimensions) {
	let topN = `
(select 
    '${dimension.name}' as dimensionName, 
    ${dimension.name} as dimensionValue, 
    ${metric} as metric, 
    ${metric} filter(${getWhereClause(selectedDimensions, dimension.name)}) as filteredMetric,
    filteredMetric / max(filteredMetric) over() as percentOfTop
from (${data.originalText}) 
where ${getWhereClause(selectedDimensions, dimension.name)}
group by 1,2 
order by 4 desc 
limit ${limit})`;
	return topN;
};

const getGrandTotalQuery = function (data, dimension, metric, selectedDimensions) {
	let query = `
(select 
    '${dimension.name}' as dimensionName,
    'Total' as dimensionValue,
    ${metric} as metric,
    ${metric} filter(${getWhereClause(selectedDimensions)}) as filteredMetric
from (${data.originalText}))`;
	return query;
};

const getDimensionCutQuery = function (
	data,
	dimension,
	metric,
	limit,
	whereClause,
	others,
	grandTotal
) {
	let otherRow = ` union all (select '${dimension.name}' as dimension, 'Others' as dimensionValue, sum(1) as metric, sum(1) filter(${whereClause}) as filteredMetric from (${data.originalText}) where ${dimension.name} not in (select dimensionValue from (${topN})) group by 1,2)`;

	return topN + (others ? otherRow : '') + (grandTotal ? grandTotalRow : '');
};

// let whereClause = 'true';

// $: if ($selectedDimensions.length > 0) {
//     whereClause = $selectedDimensions
//         .map((d) => {
//             return `${d.dimension} = '${d.value.replaceAll("'", "''")}'`;
//         })
//         .join(' and ');
// } else {
//     whereClause = 'true';
// }

export const getMainQuery = function (
	data,
	dimensions,
	metric,
	selectedDimensions,
	limit,
	grandTotal,
	others
) {
	let topN = topNQuery(data, dimensions[1], metric, limit, selectedDimensions);
	let grandTotalQuery = getGrandTotalQuery(data, dimensions[1], metric, selectedDimensions);
	let otherRow;
	let selectedRow;

	let finalQuery = dimensions
		.map((d, i) => {
			return topNQuery(data, d, metric, limit, selectedDimensions);
		})
		.join(` union all `);

	return finalQuery;
};
