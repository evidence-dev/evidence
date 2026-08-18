/**
 * Utility functions for converting between database data types and ECharts axis types
 */

export type EChartsAxisType = 'time' | 'category' | 'value';
export type JavaScriptType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

/**
 * Removes the nullable() wrapper from a ClickHouse type
 *
 * @param clickHouseType The ClickHouse data type as a string
 * @returns The cleaned type without nullable() wrapper
 */
export function cleanClickHouseType(clickHouseType?: string): string {
	if (!clickHouseType) return '';

	// Strip top-level Nullable() wrapper
	const nullableMatch = clickHouseType.match(/^nullable\((.*)\)$/i);
	let cleaned = nullableMatch && nullableMatch[1] ? nullableMatch[1] : clickHouseType;

	// Strip second-level Nullable() wrappers e.g. Array(Nullable(String)) -> Array(String)
	cleaned = cleaned.replace(/nullable\(([^()]*)\)/gi, '$1');

	// Remove spaces after commas in type params e.g. DateTime64(6, 'UTC') -> DateTime64(6,'UTC')
	cleaned = cleaned.replace(/, /g, ',');

	return cleaned;
}

/**
 * Maps a ClickHouse column type to the corresponding JavaScript type
 *
 * @param clickHouseType The ClickHouse data type as a string
 * @returns The corresponding JavaScript type
 */
export function getClickHouseToJsType(clickHouseType?: string): JavaScriptType {
	if (!clickHouseType) return 'unknown';

	const cleanedType = cleanClickHouseType(clickHouseType);
	const type = cleanedType.toLowerCase();

	// Time-based types
	if (type.includes('datetime') || type.includes('date') || type.includes('timestamp')) {
		return 'date';
	}

	// Numeric types
	if (
		type.includes('int') || // Int8, Int16, Int32, Int64, UInt8, etc.
		type.includes('float') || // Float32, Float64
		type.includes('decimal') || // Decimal
		type.includes('numeric') || // Numeric
		type === 'double' // Double
	) {
		return 'number';
	}

	// Boolean type (ClickHouse uses UInt8 with 0/1 values for booleans)
	if (type === 'boolean' || type === 'bool') {
		return 'boolean';
	}

	// Complex types
	if (
		type.includes('array') ||
		type.includes('tuple') ||
		type.includes('map') ||
		type.includes('nested')
	) {
		return 'object';
	}

	// All other types (String, FixedString, UUID, etc.)
	return 'string';
}

/**
 * Maps a database column type to the appropriate ECharts axis type
 *
 * @param jsType The javascript type as a string
 * @returns The corresponding ECharts axis type
 */
export function getEchartsType(jsType?: string): EChartsAxisType | undefined {
	if (!jsType) return undefined;

	switch (jsType) {
		case 'date':
			return 'time';
		case 'number':
			return 'value';
		default:
			return 'category';
	}
}
