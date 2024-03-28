// SQL query to get a long dimensional table
// dimension | dimensionName | metric | filteredMetric - (metric filtered by the whereClause)
// optionally includes an "Others" row and a "Grand Total" row, each which respect the whereClause

// Where clause that optionally excludes any reference to the excluded dimension
export const getWhereClause = function (selectedDimensions, excludeDimension) {
	let whereClause = 'true';
	if (excludeDimension) {
		selectedDimensions = selectedDimensions?.filter((d) => d.dimension !== excludeDimension);
	}
	if (selectedDimensions?.length > 0) {
		whereClause = selectedDimensions
			.map((d) => {
				if (d.value === null) {
					return `${d.dimension} is null`;
				} else {
					return `${d.dimension} = '${d.value.replaceAll("'", "''")}'`;
				}
			})
			.join(' and ');
	}
	return whereClause;
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
	let query = `
    with topN as (
        select 
            '${dimension.column_name}' as dimensionName, 
            ${dimension.column_name} as dimensionValue, 
            'mainList' as case, 
            ${metric} 
                -- filter(${getWhereClause(selectedDimensions, dimension.column_name)}) 
                as metric
        from (${data.originalText}) 
        where ${getWhereClause(selectedDimensions, dimension.column_name)}
        group by 1,2 
        order by 4 desc 
        limit ${limit}
    ), 
    selectedRow as (
        select 
            '${dimension.column_name}' as dimensionName, 
            ${dimension.column_name} as dimensionValue, 
            'selectedValue' as case, 
            ${metric} as metric
        from (${data.originalText}) 
        where 
        ${getWhereClause(selectedDimensions, dimension.column_name)} and 
        ${
					selectedValue
						? `${dimension.column_name} = '${selectedValue?.replaceAll("'", "''")}' and ${
								dimension.column_name
							} not in (select dimensionValue from topN)`
						: 'false'
				}  
        group by 1,2 
    ),
    final as ( 
        select * from topN
        union  all 
        select * from selectedRow
    )
    
    select 
    *, 
    metric / max(metric) over() as percentOfTop 
    from final 

`;
	return query;
};
