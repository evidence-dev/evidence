/**
 * Gets the minimum and maximum values from a column of data
 * @param data Array of objects containing the column values
 * @param column The key of the column to extract values from
 * @returns Object containing min and max values, or null if no valid values exist
 */
export function getMinMax<T>(
	data: T[],
	column: keyof T
): { min: number | null; max: number | null } {
	const values = data
		.map((row) => row[column])
		.filter(
			(value): value is T[keyof T] & number =>
				value !== null && value !== undefined && !isNaN(Number(value))
		)
		.map((value) => Number(value));

	if (!values.length) {
		return { min: null, max: null };
	}

	return {
		min: Math.min(...values),
		max: Math.max(...values)
	};
}
