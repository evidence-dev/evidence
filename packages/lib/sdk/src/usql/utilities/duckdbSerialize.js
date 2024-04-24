/**
 * Serializes a value into a format suitable for use in a DuckDB query.
 *
 * @param {any} value - The value to be serialized.
 * @return {string} The serialized value.
 */
export const duckdbSerialize = (value) => {
	if (value == null) return 'null';
	if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`;
	if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean')
		return String(value);
	if (value instanceof Date) return `'${value.toISOString()}'::TIMESTAMP_MS`;
	if (Array.isArray(value)) return `[${value.map((x) => duckdbSerialize(x)).join(', ')}]`;
	return JSON.stringify(value);
};
