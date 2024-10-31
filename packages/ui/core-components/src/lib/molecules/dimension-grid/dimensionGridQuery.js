import {
	Query as QueryBuilder,
	sql as taggedSql,
	literal,
	desc
} from '@evidence-dev/sdk/query-builder';

// SQL query to get a long dimensional table
// dimension | dimensionName | metric | filteredMetric - (metric filtered by the whereClause)
// optionally includes an "Others" row and a "Grand Total" row, each which respect the whereClause

// Where clause that optionally excludes any reference to the excluded dimension
/** @typedef {import("./types.js").SelectedDimension} SelectedDimension */
/**
 * @param {selectedDimension} selectedDimensions
 * @param {string} [excludeDimension]
 * @returns {string}
 */
export const getWhereClause = function (selectedDimensions, excludeDimension) {
	let whereClause = 'true';
	if (excludeDimension) {
		selectedDimensions = selectedDimensions?.filter((d) => d.dimension !== excludeDimension);
	}
	if (selectedDimensions?.length > 0) {
		whereClause = selectedDimensions
			.map((d) => {
				const values = Array.isArray(d.value) ? d.value : [d.value];

				const { validValues, hasNull } = values.reduce(
					(a, v) => {
						if (v === null) {
							a.hasNull = true;
						} else {
							a.validValues.add(`'${v.toString().replaceAll(`'`, `''`)}'`);
						}
						return a;
					},
					{ validValues: new Set(), hasNull: false }
				);
				// "dimension" in ('value', 'from', 'set')
				const valueExpr = validValues.size
					? `"${d.dimension}" in ( ${[...validValues].join(',')} )`
					: '';
				// "dimension" is null
				const nullExpr = hasNull ? `"${d.dimension}" is null` : '';

				return `( ${[valueExpr, nullExpr].filter(Boolean).join(' OR ')} )`;
			})
			.join(' and ');
	}
	return `( ${whereClause} )`;
};

export const getDimensionCutQuery = function (
	/** @type {import("@evidence-dev/sdk/usql").Query} */
	data,
	/** @type {import("@evidence-dev/sdk/usql").DescribeResultRow} */
	dimension,
	/** @type {string} */
	metric,
	/** @type {number} */
	limit,
	selectedDimensions,
	selectedValue
) {
	const topN = new QueryBuilder();
	topN
		.select({
			dimensionName: literal(dimension.column_name),
			dimensionValue: taggedSql`${dimension.column_name}`,
			metric: taggedSql`${metric}`,
			case: literal('mainList')
		})
		.from(taggedSql`(${data.originalText})`)
		.where(taggedSql`${getWhereClause(selectedDimensions, dimension.column_name)}`)
		.$groupby('dimensionName', 'dimensionValue')
		.orderby(desc('metric'))
		.limit(limit);

	const selectedRow = new QueryBuilder();
	selectedRow
		.select({
			dimensionName: literal(dimension.column_name),
			dimensionValue: taggedSql`${dimension.column_name}`,
			metric: taggedSql`${metric}`,
			case: literal('selectedValue')
		})
		.from(taggedSql`(${data.originalText})`)
		.where(taggedSql`${getWhereClause(selectedDimensions, dimension.column_name)}`)
		.where(taggedSql`${filterBySelect(selectedValue, dimension.column_name)}`)
		.$groupby('dimensionName', 'dimensionValue');

	const final = QueryBuilder.with({ topN, selectedRow })
		.select('*')
		.select({
			percentOfTop: taggedSql`metric / max(metric) over ()`
		})
		.from(taggedSql`(SELECT * FROM "topN" UNION ALL SELECT * FROM "selectedRow")`);
	return final.toString();
};

/**
 * @param {string | string[] | undefined} selectedValue
 * @param {string} colName
 * @returns {string}
 */
const filterBySelect = (selectedValue, colName) => {
	if (Array.isArray(selectedValue)) {
		if (selectedValue.length === 0) {
			return 'false';
		} else {
			const selectedConditions = selectedValue
				.map((v) => `${colName} = '${v?.replaceAll("'", "''")}'`)
				.join(' or ');

			return `(${selectedConditions}) and ${colName} not in (select dimensionValue from topN)`;
			// selectedValue.map((v) => `${colName} = '${v?.replaceAll("'", "''")}'`).join(' or ') +
			// `and ${colName} not in (select dimensionValue from topN)`
			// need to adjust line 95
			// cannot have duplicate keys, (dimensionValue = column name string) and (dimensionName = column name variable)
		}
	} else if (typeof selectedValue === 'string') {
		return `${colName} = '${selectedValue?.replaceAll("'", "''")}' and ${colName} not in (select dimensionValue from topN)`;
	} else {
		return 'false';
	}
};
